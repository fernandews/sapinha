import { Message, MessageMedia } from 'whatsapp-web.js';
import ytDlp from 'yt-dlp-exec';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { Command } from '../@types/command';
import { musicaCommand } from '../content/musicaData';
import { spawn } from 'child_process';
import yts from 'yt-search';

const ytDlpBinary = path.resolve(process.cwd(), 'node_modules', 'yt-dlp-exec', 'bin', 'yt-dlp.exe');
const ffmpegExecPath = path.resolve(ffmpegInstaller.path);

export async function tratarComandoMusica(message: Message, query: string, client: any) {
    // 1. Limpa o texto da busca (remove prefixos como !)
    const termoBusca = query.replace(/^[!#?]+/, '').trim();

    if (!termoBusca) {
        await message.reply('🐸✨ Por favor, diga o nome da música ou cantor!');
        return;
    }

    const tempFolder = path.resolve(process.cwd(), 'temp');
    if (!fs.existsSync(tempFolder)) {
        fs.mkdirSync(tempFolder, { recursive: true });
    }

    try {
        await message.reply(`🐸🎵 Procurando por "${termoBusca}"... ✨`);

        // 2. Faz a busca via yt-search para obter o link direto
        const searchResult = await yts(termoBusca);
        const video = searchResult.videos[0];

        if (!video) {
            await message.reply('🐸💔 Poxa, a Sapinha não encontrou nenhuma música com esse nome!');
            return;
        }

        console.log(`[yt-search] Encontrado: ${video.title} (${video.url})`);

        const fileBaseName = `audio_${Date.now()}`;
        const outputPattern = path.join(tempFolder, `${fileBaseName}.%(ext)s`);

        // 3. Executa o yt-dlp passando a URL DIRETA do vídeo (sem usar ytsearch1:)
        await new Promise<void>((resolve, reject) => {
            const args = [
                video.url, // URL direta obtida na busca
                '--extract-audio',
                '--audio-format', 'mp3',
                '--output', outputPattern,
                '--no-playlist',
                '--no-part',
                '--restrict-filenames',
                '--ffmpeg-location', ffmpegExecPath,
                '--no-check-certificates',
                '--extractor-args', 'youtube:player_client=android,web'
            ];

            const child = spawn(ytDlpBinary, args);

            child.stdout.on('data', (data) => console.log(`[yt-dlp]: ${data.toString().trim()}`));
            child.stderr.on('data', (data) => console.error(`[yt-dlp ERR]: ${data.toString().trim()}`));

            child.on('close', (code) => {
                if (code === 0) resolve();
                else reject(new Error(`yt-dlp encerrou com código: ${code}`));
            });

            child.on('error', reject);
        });

        // 4. Envia o áudio gerado
        const arquivos = fs.readdirSync(tempFolder);
        const arquivoEncontrado = arquivos.find(file => file.startsWith(fileBaseName));

        if (!arquivoEncontrado) {
            throw new Error(`Arquivo não encontrado na pasta temp.`);
        }

        const arquivoBaixado = path.join(tempFolder, arquivoEncontrado);
        const media = MessageMedia.fromFilePath(arquivoBaixado);

        await client.sendMessage(message.from, media, {
            sendAudioAsVoice: false
        });

        console.log(`🎵 Música enviada: ${video.title}`);

        // Limpa o arquivo temporário
        fs.unlinkSync(arquivoBaixado);

    } catch (error) {
        console.error('Erro detalhado no handler de música:', error);
        await message.reply('🐸💔 A Sapinha teve um problema para baixar essa música!');
    }
}

const musicaCommandImplement: Command = {
    ...musicaCommand,

    async execute(message, client, args) {
        const query = message.body.trim().split(' ').slice(1); // Remove o comando da mensagem

        if (!query) {
            await message.reply('🐸✨ Por favor, diga o nome da música ou cantor! Exemplo: `!musica Eduardo e Mônica` 💕');
            return;
        }

        await tratarComandoMusica(message, args.join(" ").replace(/^[!#?]+/, '').trim(), client);
    }
};

export default musicaCommandImplement;