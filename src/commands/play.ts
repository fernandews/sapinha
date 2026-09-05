import { Command } from '../@types/command';
import { MessageMedia } from 'whatsapp-web.js';
import yts from 'yt-search';
import ytdl from '@distube/ytdl-core';

const playCommand: Command = {
    name: 'DJ Sapinha',
    description: 'Toca uma música do YouTube no chat',
    triggers: ['!play', '!musica', '!tocar'],

    async execute(msg, client, args) {
        const busca = args.join(' ');

        if (!busca) {
            await msg.reply('🐸🎶 Qual música você quer ouvir? Digite: *!play nome da musica*');
            return;
        }

        try {
            // Reage à mensagem do usuário para indicar que recebeu o comando 🫡
            await msg.react('🫡');

            // 1. Pesquisa o vídeo no YouTube
            const searchResult = await yts(busca);
            const video = searchResult.videos[0];

            if (!video) {
                await msg.reply('🐸💔 Poxa, não encontrei essa música no YouTube! Quer tentar com outro nome?');
                return;
            }

            // 2. Faz o download do áudio em buffer
            const stream = ytdl(video.url, {
                filter: 'audioonly',
                quality: 'highestaudio',
            });

            const chunks: Buffer[] = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const audioBuffer = Buffer.concat(chunks);

            // 3. Converte para MessageMedia
            const media = new MessageMedia(
                'audio/mp3',
                audioBuffer.toString('base64'),
                `${video.title}.mp3`
            );

            // 4. Envia apenas o áudio no chat como mensagem de áudio
            await msg.reply(media, undefined, { sendAudioAsVoice: true });

        } catch (error) {
            console.error('Erro ao tocar música:', error);
            await msg.reply('❌ Ocorreu um erro ao baixar a música. Tente novamente mais tarde! 🐸💔');
        }
    }
};

export default playCommand;