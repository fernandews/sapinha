import { Client, Message, MessageMedia } from 'whatsapp-web.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { Command } from '../@types/command';
import { musicaCommand } from '../content/musicaData';
import yts from 'yt-search';

// Executa o ajuste diretamente no navegador.
// A string evita o erro "__name is not defined" causado pelo tsx.
async function corrigirEnvioDeMidia(
    client: Client
): Promise<void> {
    const page = client.pupPage;

    if (!page || page.isClosed()) {
        throw new Error(
            'O navegador do WhatsApp não está disponível.'
        );
    }

    await page.evaluate(`
        (() => {
            const api = window.WWebJS;

            if (
                !api ||
                typeof api.processMediaData !== 'function'
            ) {
                throw new Error(
                    'A sessão do WhatsApp ainda não está pronta.'
                );
            }

            const original = api.processMediaData;

            if (original.__sapinhaMediaIdFix) {
                return;
            }

            const corrigida = async function (...args) {
                const media = await original.apply(this, args);

                const dados = {
                    ...media,
                    ...(typeof media.toJSON === 'function'
                        ? media.toJSON()
                        : {})
                };

                // Evita que o ID interno da mídia
                // substitua o ID da mensagem.
                delete dados.__x_id;
                delete dados.toJSON;

                return dados;
            };

            Object.defineProperty(
                corrigida,
                '__sapinhaMediaIdFix',
                { value: true }
            );

            api.processMediaData = corrigida;
        })()
    `);
}

function traduzirErro(error: unknown): string {
    const texto = error instanceof Error
        ? error.message
        : String(error);

    if (/this video is not available|video unavailable/i.test(texto)) {
        return 'Esse vídeo está indisponível no YouTube. Tente outra música ou outro nome.';
    }

    if (/sign in to confirm|not a bot/i.test(texto)) {
        return 'O YouTube solicitou uma verificação de acesso e bloqueou o download.';
    }

    if (/private video/i.test(texto)) {
        return 'O vídeo é privado e não pode ser baixado com o acesso atual.';
    }

    if (/age.restricted|confirm your age/i.test(texto)) {
        return 'O vídeo possui restrição de idade.';
    }

    if (/__name is not defined/i.test(texto)) {
        return 'O navegador recebeu uma função auxiliar que não está disponível.';
    }

    if (/data passed to getter must include an id/i.test(texto)) {
        return 'O WhatsApp encontrou um identificador inválido ao preparar a mensagem de áudio.';
    }

    if (/target closed|session closed|connection closed/i.test(texto)) {
        return 'A conexão com o navegador do WhatsApp foi encerrada.';
    }

    if (/execution context was destroyed/i.test(texto)) {
        return 'A página do WhatsApp foi recarregada durante a operação.';
    }

    if (/timed out|timeout|ETIMEDOUT/i.test(texto)) {
        return 'A operação demorou mais do que o tempo permitido.';
    }

    if (/ENOSPC/i.test(texto)) {
        return 'Não há espaço livre suficiente para salvar o áudio.';
    }

    if (/EACCES|EPERM/i.test(texto)) {
        return 'O sistema negou permissão para acessar um arquivo ou executar um programa.';
    }

    if (/ENOENT/i.test(texto)) {
        return 'Um arquivo ou programa necessário não foi encontrado.';
    }

    // Preserva mensagens em português criadas neste arquivo.
    if (
        /^(O |A |Não |Nenhum |yt-dlp não encontrado|FFmpeg não encontrado)/.test(
            texto
        )
    ) {
        return texto;
    }

    return 'Não foi possível concluir a operação. Consulte os detalhes técnicos no terminal.';
}

export async function tratarComandoMusica(
    message: Message,
    query: string,
    client: Client
): Promise<void> {
    const termoBusca = query.trim();

    if (!termoBusca) {
        await message.reply(
            '🐸✨ Informe o nome da música ou do cantor!\n\n' +
            'Exemplo: !musica Eduardo e Mônica'
        );
        return;
    }

    let pastaTemporaria: string | null = null;
    let etapa = 'preparação';

    try {
        const tempRoot = path.resolve(
            process.cwd(),
            'temp'
        );

        fs.mkdirSync(tempRoot, { recursive: true });

        // Cada pedido recebe uma pasta exclusiva.
        pastaTemporaria = fs.mkdtempSync(
            path.join(tempRoot, 'musica-')
        );

        const nomeBase = `audio_${randomUUID()}`;

        const outputPattern = path.join(
            pastaTemporaria,
            `${nomeBase}.%(ext)s`
        );

        const ffmpegPath = path.resolve(
            ffmpegInstaller.path
        );

        const ytDlpBinary = path.resolve(
            process.cwd(),
            'node_modules',
            'yt-dlp-exec',
            'bin',
            process.platform === 'win32'
                ? 'yt-dlp.exe'
                : 'yt-dlp'
        );

        if (!fs.existsSync(ytDlpBinary)) {
            throw new Error(
                `yt-dlp não encontrado em: ${ytDlpBinary}`
            );
        }

        if (!fs.existsSync(ffmpegPath)) {
            throw new Error(
                `FFmpeg não encontrado em: ${ffmpegPath}`
            );
        }

        etapa = 'pesquisa';

        await message.reply(
            `🐸🎵 Procurando por "${termoBusca}"...`
        );

        const resultado = await yts(termoBusca);
        const video = resultado.videos?.[0];

        if (!video) {
            await message.reply(
                '🐸💔 Não encontrei nenhuma música com esse nome.'
            );
            return;
        }

        console.log(
            `[pesquisa] Música encontrada: ${video.title}`
        );

        console.log(
            `[pesquisa] Endereço: ${video.url}`
        );

        etapa = 'download e conversão';

        await new Promise<void>((resolve, reject) => {
            const argumentos = [
                video.url,
                '--extract-audio',
                '--audio-format',
                'mp3',
                '--audio-quality',
                '5',
                '--output',
                outputPattern,
                '--no-playlist',
                '--no-part',
                '--restrict-filenames',
                '--ffmpeg-location',
                ffmpegPath
            ];

            console.log(
                '[download] Iniciando download e conversão para MP3...'
            );

            const child = spawn(
                ytDlpBinary,
                argumentos,
                { windowsHide: true }
            );

            let detalhes = '';

            child.stdout.on('data', (data: Buffer) => {
                console.log(
                    `[yt-dlp] ${data.toString().trim()}`
                );
            });

            child.stderr.on('data', (data: Buffer) => {
                const texto = data.toString();

                detalhes = (detalhes + texto).slice(-16000);

                // Mantém a saída original para diagnóstico.
                console.error(
                    `[yt-dlp — detalhe técnico] ${texto.trim()}`
                );
            });

            child.once('error', (error: Error) => {
                reject(
                    new Error(
                        `Não foi possível executar o programa de download: ${error.message}`
                    )
                );
            });

            child.once(
                'close',
                (code: number | null) => {
                    if (code === 0) {
                        resolve();
                        return;
                    }

                    reject(
                        new Error(
                            `O download terminou com código ${code}.\n${detalhes}`
                        )
                    );
                }
            );
        });

        etapa = 'localização do MP3';

        const nomeArquivo = fs
            .readdirSync(pastaTemporaria)
            .find(
                (file) =>
                    file.startsWith(nomeBase) &&
                    file.toLowerCase().endsWith('.mp3')
            );

        if (!nomeArquivo) {
            throw new Error(
                'O download terminou, mas o arquivo MP3 não foi encontrado.'
            );
        }

        const arquivoBaixado = path.join(
            pastaTemporaria,
            nomeArquivo
        );

        const tamanhoArquivo = fs
            .statSync(arquivoBaixado)
            .size;

        if (tamanhoArquivo <= 0) {
            throw new Error(
                'O arquivo de áudio foi criado vazio.'
            );
        }

        console.log(
            `[arquivo] MP3 criado: ${arquivoBaixado}`
        );

        console.log(
            `[arquivo] Tamanho: ${tamanhoArquivo} bytes`
        );

        etapa = 'preparação da mídia';

        const media = MessageMedia.fromFilePath(
            arquivoBaixado
        );

        etapa = 'compatibilidade do WhatsApp';

        await corrigirEnvioDeMidia(client);

        etapa = 'envio ao WhatsApp';

        console.log(
            '[WhatsApp] Iniciando envio do áudio:',
            {
                tipo: media.mimetype,
                tamanhoEmBytes: tamanhoArquivo
            }
        );

        await client.sendMessage(
            message.from,
            media,
            {
                sendAudioAsVoice: false
            }
        );

        console.log(
            `[WhatsApp] Áudio enviado: ${video.title}`
        );

    } catch (error: unknown) {
        const explicacao = traduzirErro(error);

        console.error(
            `❌ Erro no comando de música — etapa: ${etapa}`
        );

        console.error(
            `[explicação] ${explicacao}`
        );

        console.error(
            '[detalhes técnicos]',
            error
        );

        try {
            await message.reply(
                `🐸💔 Falha na etapa: ${etapa}.\n\n` +
                explicacao
            );
        } catch (replyError: unknown) {
            console.error(
                '[WhatsApp] Não foi possível enviar o aviso de erro:',
                traduzirErro(replyError)
            );
        }
    } finally {
        if (pastaTemporaria) {
            try {
                // Remove somente a pasta exclusiva deste pedido.
                fs.rmSync(
                    pastaTemporaria,
                    {
                        recursive: true,
                        force: true
                    }
                );

                console.log(
                    '[limpeza] Arquivos temporários removidos.'
                );
            } catch (cleanupError: unknown) {
                console.error(
                    '[limpeza] Não foi possível remover os arquivos temporários:',
                    traduzirErro(cleanupError)
                );
            }
        }
    }
}

const musicaCommandImplement: Command = {
    ...musicaCommand,

    async execute(message, client, args) {
        // Remove !musica ou outro comando da busca.
        const query = args
            .slice(1)
            .join(' ')
            .trim();

        await tratarComandoMusica(
            message,
            query,
            client
        );
    }
};

export default musicaCommandImplement;