import { Message, MessageMedia } from 'whatsapp-web.js';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { Command } from '../@types/command';
import { musicaCommand } from '../content/musicaData';
import yts from 'yt-search';

const ytDlpBinary = path.resolve(
    process.cwd(),
    'node_modules',
    'yt-dlp-exec',
    'bin',
    process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);
const ffmpegExecPath = path.resolve(ffmpegInstaller.path);

function executarYtDlp(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(ytDlpBinary, args, { windowsHide: true });
        let stderr = '';

        child.stdout.on('data', (data) => {
            console.log(`[yt-dlp] ${data.toString().trim()}`);
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            stderr += output;
            console.error(`[yt-dlp] ${output.trim()}`);
        });

        child.once('error', (error) => {
            reject(new Error(`Não foi possível executar o yt-dlp: ${error.message}`));
        });

        child.once('close', (code) => {
            if (code === 0) {
                resolve(stderr);
                return;
            }

            reject(new Error(`yt-dlp encerrou com código ${code}.\n${stderr}`));
        });
    });
}

export async function tratarComandoMusica(
    message: Message,
    query: string,
    client: any
): Promise<void> {
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

    try {
        if (!fs.existsSync(ytDlpBinary)) {
            throw new Error(`yt-dlp não encontrado em: ${ytDlpBinary}`);
        }

        if (!fs.existsSync(ffmpegExecPath)) {
            throw new Error(`FFmpeg não encontrado em: ${ffmpegExecPath}`);
        }

        await message.reply(`🐸🎵 Procurando por "${termoBusca}"... ✨`);

        const searchResult = await yts(termoBusca);
        const video = searchResult.videos[0];

        if (!video) {
            await message.reply('🐸💔 A Sapinha não encontrou nenhuma música com esse nome.');
            return;
        }

        const fileBaseName = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const outputPattern = path.join(tempFolder, `${fileBaseName}.%(ext)s`);

        console.log(`[yt-search] Encontrado: ${video.title} (${video.url})`);

        await executarYtDlp([
            video.url,
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '5',
            '--output', outputPattern,
            '--no-playlist',
            '--no-part',
            '--restrict-filenames',
            '--ffmpeg-location', ffmpegExecPath,
            '--no-warnings',
            '--no-check-certificates',
            '--extractor-args', 'youtube:player_client=android,web',
        ]);

        const arquivoEncontrado = fs.readdirSync(tempFolder).find(
            (file) =>
                file.startsWith(fileBaseName) &&
                file.toLowerCase().endsWith('.mp3')
        );

        if (!arquivoEncontrado) {
            throw new Error('O yt-dlp terminou, mas o arquivo MP3 não foi encontrado.');
        }

        arquivoBaixado = path.join(tempFolder, arquivoEncontrado);
        const tamanhoArquivo = fs.statSync(arquivoBaixado).size;

        if (tamanhoArquivo <= 0) {
            throw new Error('O arquivo de áudio foi criado vazio.');
        }

        const media = MessageMedia.fromFilePath(arquivoBaixado);

        console.log('DEBUG message.from', message.from);
        console.log('DEBUG media', {
            mimetype: media.mimetype,
            filename: media.filename,
            temData: !!media.data
        });
        
        await client.sendMessage(message.from, media, { sendAudioAsVoice: false });
        console.log(`🎵 Música enviada: ${video.title}`);
    } catch (error) {
        console.error('❌ Erro no comando de música:', error);
        await message.reply(
            '🐸💔 A Sapinha não conseguiu baixar essa música.\n\n' +
            'Tente novamente ou pesquise pelo nome exato da música.'
        );
    } finally {
        if (arquivoBaixado && fs.existsSync(arquivoBaixado)) {
            try {
                fs.unlinkSync(arquivoBaixado);
            } catch (cleanupError) {
                console.error('Erro ao remover o arquivo temporário:', cleanupError);
            }
        }
    }
}

const musicaCommandImplement: Command = {
    ...musicaCommand,

    async execute(message, client, args) {
        const query = args.slice(1).join(' ').trim();

        if (!query) {
            await message.reply(
                '🐸✨ Por favor, diga o nome da música ou cantor!\n\n' +
                'Exemplo: !musica Eduardo e Mônica'
            );
            return;
        }

        await tratarComandoMusica(message, query, client);
    },
};

export default musicaCommandImplement;
