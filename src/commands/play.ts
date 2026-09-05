import { Client, Message, MessageMedia } from 'whatsapp-web.js';
import play from 'play-dl';
import { Command } from '../@types/command';

export const playCommand: Command = {
    name: 'Tocar Música',
    description: 'Busca e envia o áudio de uma música do YouTube 🎵✨',
    triggers: ['!tocar', '!play', '!musica'],
    adminOnly: false,

    async execute(msg: Message, _client: Client, args: string[]) {
        const busca = args.join(' ');

        if (!busca) {
            await msg.reply('🐸 streamer da shopee! Me diz o nome da música ou manda o link pra sapinha tocar! ✨');
            return;
        }

        try {
            await msg.react('🎵');

            // 1. Busca o vídeo no YouTube
            const ytResults = await play.search(busca, { limit: 1 });

            if (!ytResults || ytResults.length === 0) {
                await msg.reply('🐸💔 Não achei nenhuma música com esse nome no YouTube!');
                return;
            }

            const video = ytResults[0];

            // 2. Extrai o stream de áudio do vídeo encontrado
            const streamInfo = await play.stream(video.url, { quality: 2 }); // Qualidade otimizada de áudio

            // 3. Converte o stream em Buffer para a transmissão no WhatsApp
            const chunks: Buffer[] = [];
            for await (const chunk of streamInfo.stream) {
                chunks.push(chunk);
            }
            const audioBuffer = Buffer.concat(chunks);

            // 4. Monta a mídia e envia como mensagem de voz
            const media = new MessageMedia(
                'audio/mp3',
                audioBuffer.toString('base64'),
                `${video.title}.mp3`
            );

            await msg.reply(media, undefined, { sendAudioAsVoice: true });
        } catch (error) {
            console.error('Erro ao processar comando de música:', error);
            await msg.reply('🐸💔 A sapinha deu uma moscada ao tentar baixar o áudio! Tenta de novo em instantes? ✨');
        }
    }
};