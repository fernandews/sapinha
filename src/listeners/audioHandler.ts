import { Client, MessageMedia } from 'whatsapp-web.js';
import Groq from 'groq-sdk';
import * as path from 'path';
import * as fs from 'fs';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function processarAudio(msg: any, client: Client) {
    const media: MessageMedia = await msg.downloadMedia();
    if (!media || !media.data) return;

        const tempFilePath = path.join(__dirname, `temp_${Date.now()}.ogg`);
        fs.writeFileSync(tempFilePath, media.data, 'base64');

        const transcription = await groq.audio.transcriptions.create({
            file: fs.createReadStream(tempFilePath),
            model: 'whisper-large-v3',
            language: 'pt', // Força o idioma para português
            response_format: 'json',
        });

        fs.unlinkSync(tempFilePath);

        const textoTranscrit = transcription.text;
        if (!textoTranscrit.trim()) {
            msg.reply('🐸✨ Ops! Não consegui entender o áudio. Poderia repetir, por favor? 💕');
            return '';
        };
        return textoTranscrit;
};