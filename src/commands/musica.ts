import { Message, MessageMedia } from 'whatsapp-web.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import { Command } from '../@types/command';
import { musicaCommand } from '../content/musicaData';
import yts from 'yt-search';

export async function tratarComandoMusica(
    message: Message,
    query: string,
    client: any
) {
    const termoBusca = query.replace(/^[!#?]+/, '').trim();

    if (!termoBusca) {
        await message.reply(
            '🐸✨ Por favor, diga o nome da música ou cantor!\n\n' +
            'Exemplo: !musica Eduardo e Mônica'
        );
        return;
    }

    const tempFolder = path.resolve(process.cwd(), 'temp');
    fs.mkdirSync(tempFolder, { recursive: true });

    let arquivoBaixado: string | null = null;
    let etapa = 'pesquisa';

    try {
        await message.reply(
            `🐸🎵 Procurando por "${termoBusca}"...`
        );

        const searchResult = await yts(termoBusca);

        if (!searchResult.videos || searchResult.videos.length === 0) {
            await message.reply(
                '🐸💔 A Sapinha não encontrou nenhuma música com esse nome.'
            );
            return;
        }

        const video = searchResult.videos[0];

        console.log(`[yt-search] Encontrado: ${video.title}`);
        console.log(`[yt-search] URL: ${video.url}`);

        // Nome exclusivo para evitar misturar pedidos simultâneos.
        const fileBaseName = `audio_${randomUUID()}`;

        // As crases e o "s" em %(ext)s são necessários.
        const outputPattern = path.join(
            tempFolder,
            `${fileBaseName}.%(ext)s`
        );

        const ffmpegPath = path.resolve(ffmpegInstaller.path);

        const ytDlpBinary = path.resolve(
            process.cwd(),
            'node_modules',
            'yt-dlp-exec',
            'bin',
            process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
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

        console.log(`[yt-dlp] Executável: ${ytDlpBinary}`);
        console.log(`[ffmpeg] Executável: ${ffmpegPath}`);

        etapa = 'download e conversão';

        await new Promise<void>((resolve, reject) => {
            const args = [
                video.url,
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '5',
                '--output', outputPattern,
                '--no-playlist',
                '--no-part',
                '--restrict-filenames',
                '--ffmpeg-location', ffmpegPath,
                '--no-warnings',
                '--no-check-certificates'
            ];

            console.log('[yt-dlp] Iniciando download...');

            const child = spawn(ytDlpBinary, args, {
                windowsHide: true
            });

            let stderr = '';

            child.stdout.on('data', (data) => {
                console.log(
                    `[yt-dlp] ${data.toString().trim()}`
                );
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;

                console.error(
                    `[yt-dlp] ${output.trim()}`
                );
            });

            child.on('error', (error) => {
                reject(
                    new Error(
                        `Não foi possível executar o yt-dlp: ${error.message}`
                    )
                );
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve();
                    return;
                }

                reject(
                    new Error(
                        `yt-dlp encerrou com código ${code}.\n${stderr}`
                    )
                );
            });
        });

        etapa = 'localização do MP3';

        const arquivos = fs.readdirSync(tempFolder);

        const arquivoEncontrado = arquivos.find(
            (file) =>
                file.startsWith(fileBaseName) &&
                file.toLowerCase().endsWith('.mp3')
        );

        if (!arquivoEncontrado) {
            throw new Error(
                'O yt-dlp terminou, mas o arquivo MP3 não foi encontrado.'
            );
        }

        arquivoBaixado = path.join(
            tempFolder,
            arquivoEncontrado
        );

        console.log(`[arquivo] ${arquivoBaixado}`);

        if (!fs.existsSync(arquivoBaixado)) {
            throw new Error(
                'O arquivo de áudio não existe.'
            );
        }

        const tamanhoArquivo = fs.statSync(arquivoBaixado).size;

        if (tamanhoArquivo <= 0) {
            throw new Error(
                'O arquivo de áudio foi criado vazio.'
            );
        }

        console.log(
            `[arquivo] Tamanho: ${tamanhoArquivo} bytes`
        );

        etapa = 'preparação da mídia';

        const media = MessageMedia.fromFilePath(
            arquivoBaixado
        );

        etapa = 'envio ao WhatsApp';

        console.log('[whatsapp] Iniciando envio do MP3:', {
            mimetype: media.mimetype,
            bytes: tamanhoArquivo
        });

        await client.sendMessage(
            message.from,
            media,
            {
                sendAudioAsVoice: false
            }
        );

        console.log(`🎵 Música enviada: ${video.title}`);

        try {
            fs.unlinkSync(arquivoBaixado);
            console.log('[temp] Arquivo removido.');
        } catch (cleanupError) {
            console.error(
                '[temp] Não foi possível remover o arquivo:',
                cleanupError
            );
        }

        arquivoBaixado = null;
    } catch (error) {
        console.error(
            `❌ ERRO NO COMANDO DE MÚSICA — etapa: ${etapa}`,
            error
        );

        await message.reply(
            `🐸💔 Não consegui concluir a música na etapa: ${etapa}. ` +
            'O detalhe do erro foi registrado no servidor.'
        );
    } finally {
        if (
            arquivoBaixado &&
            fs.existsSync(arquivoBaixado)
        ) {
            try {
                fs.unlinkSync(arquivoBaixado);
                console.log('[temp] Arquivo temporário removido.');
            } catch (cleanupError) {
                console.error(
                    '[temp] Erro ao limpar arquivo:',
                    cleanupError
                );
            }
        }
    }
}

const musicaCommandImplement: Command = {
    ...musicaCommand,

    async execute(message, client, args) {
        // O primeiro argumento é o comando (!musica, !play etc.).
        const query = args
            .slice(1)
            .join(' ')
            .replace(/^[!#?]+/, '')
            .trim();

        if (!query) {
            await message.reply(
                '🐸✨ Por favor, diga o nome da música ou cantor!\n\n' +
                'Exemplo: !musica Eduardo e Mônica'
            );
            return;
        }

        await tratarComandoMusica(
            message,
            query,
            client
        );
    }
};

export default musicaCommandImplement;