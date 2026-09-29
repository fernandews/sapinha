import { Message, MessageMedia } from 'whatsapp-web.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';

import { Command } from '../@types/command';

import yts from 'yt-search';
import { musicaCommand } from '../content/musicaData';

export async function tratarComandoMusica(
    message: Message,
    query: string,
    client: any
) {
    const termoBusca = query
        .replace(/^[!#?]+/, '')
        .trim();

    if (!termoBusca) {
        await message.reply(
            '🐸✨ Por favor, diga o nome da música ou cantor!\n\n' +
            'Exemplo: !musica Eduardo e Mônica'
        );
        return;
    }

    const tempFolder = path.resolve(process.cwd(), 'temp');

    if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder, { recursive: true });
    }

    let arquivoBaixado: string | null = null;

    try {
        await message.reply(
            `🐸🎵 Procurando por "${termoBusca}"...`
        );

        // --------------------------------------------------
        // 1. Pesquisa no YouTube
        // --------------------------------------------------

        const searchResult = await yts(termoBusca);

        if (!searchResult.videos || searchResult.videos.length === 0) {
            await message.reply(
                '🐸💔 A Sapinha não encontrou nenhuma música com esse nome.'
            );
            return;
        }

        const video = searchResult.videos[0];

        console.log(
            `[yt-search] Encontrado: ${video.title}`
        );

        console.log(
            '[yt-search] URL: ${video.url}'
        );

        // --------------------------------------------------
        // 2. Define os arquivos temporários
        // --------------------------------------------------

        const fileBaseName = 'audio_${Date.now()}';

        const outputPattern = path.join(
            tempFolder,
            '${fileBaseName}.%(ext)'
        );

        const ffmpegPath = path.resolve(
            ffmpegInstaller.path
        );

        // --------------------------------------------------
        // 3. Localiza o yt-dlp
        // --------------------------------------------------

        let ytDlpBinary: string;

        if (process.platform === 'win32') {
            ytDlpBinary = path.resolve(
                process.cwd(),
                'node_modules',
                'yt-dlp-exec',
                'bin',
                'yt-dlp.exe'
            );
        } else {
            ytDlpBinary = path.resolve(
                process.cwd(),
                'node_modules',
                'yt-dlp-exec',
                'bin',
                'yt-dlp'
            );
        }

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

        console.log(
            `[yt-dlp] Executável: ${ytDlpBinary}`
        );

        console.log(
            `[ffmpeg] Executável: ${ffmpegPath}`
        );

        // --------------------------------------------------
        // 4. Baixa e converte para MP3
        // --------------------------------------------------

        await new Promise<void>((resolve, reject) => {
            const args = [
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
                ffmpegPath,

                // Evita algumas mensagens desnecessárias
                '--no-warnings',

                // Evita tentar baixar playlist
                '--no-check-certificates'
            ];

            console.log(
                `[yt-dlp] Iniciando download...`
            );

            const child = spawn(
                ytDlpBinary,
                args,
                {
                    windowsHide: true
                }
            );

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

        // --------------------------------------------------
        // 5. Procura o MP3 criado
        // --------------------------------------------------

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

        console.log(
            `[arquivo] ${arquivoBaixado}`
        );

        // --------------------------------------------------
        // 6. Verifica se o arquivo realmente existe
        // --------------------------------------------------

        if (!fs.existsSync(arquivoBaixado)) {
            throw new Error(
                'O arquivo de áudio não existe.'
            );
        }

        const tamanhoArquivo =
            fs.statSync(arquivoBaixado).size;

        if (tamanhoArquivo <= 0) {
            throw new Error(
                'O arquivo de áudio foi criado vazio.'
            );
        }

        console.log(
            `[arquivo] Tamanho: ${tamanhoArquivo} bytes`
        );

        // --------------------------------------------------
        // 7. Converte o arquivo para mídia do WhatsApp
        // --------------------------------------------------

        const media =
            MessageMedia.fromFilePath(
                arquivoBaixado
            );

        // --------------------------------------------------
        // 8. Envia para o chat
        // --------------------------------------------------

        await client.sendMessage(
            message.from,
            media,
            {
                sendAudioAsVoice: false
            }
        );

        console.log(
            `🎵 Música enviada: ${video.title}`
        );

        // --------------------------------------------------
        // 9. Remove o arquivo temporário
        // --------------------------------------------------

        try {
            fs.unlinkSync(arquivoBaixado);

            console.log(
                '[temp] Arquivo removido.'
            );
        } catch (cleanupError) {
            console.error(
                '[temp] Não foi possível remover o arquivo:',
                cleanupError
            );
        }

        arquivoBaixado = null;

    } catch (error: any) {

        console.error(
            '===================================='
        );

        console.error(
            '❌ ERRO NO COMANDO DE MÚSICA'
        );

        console.error(
            error
        );

        console.error(
            '===================================='
        );

        await message.reply(
            '🐸💔 A Sapinha não conseguiu baixar essa música.\n\n' +
            'Tente novamente ou pesquise pelo nome exato da música.'
        );

    } finally {

        // --------------------------------------------------
        // Limpeza de segurança
        // --------------------------------------------------

        if (
            arquivoBaixado &&
            fs.existsSync(arquivoBaixado)
        ) {
            try {
                fs.unlinkSync(arquivoBaixado);

                console.log(
                    '[temp] Arquivo temporário removido.'
                );
            } catch (cleanupError) {
                console.error(
                    '[temp] Erro ao limpar arquivo:',
                    cleanupError
                );
            }
        }
    }
}

// ==========================================================
// COMANDO
// ==========================================================

const musicaCommandImplement: Command = {

    ...musicaCommand,

    async execute(
        message,
        client,
        args
    ) {

        const query = args
            .join(' ')
            .replace(/^[!#?]+/, '')
            .trim();

        if (!query) {

            await message.reply(
                '🐸✨ Por favor, diga o nome da música ou cantor!\n\n' +
                'Exemplo:\n' +
                '!musica Eduardo e Mônica'
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