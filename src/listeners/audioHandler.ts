import { Client, MessageMedia } from 'whatsapp-web.js';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function processarAudio(msg: any, client: Client) {
    try {
        // Verifica se a mensagem contém áudio/PTT
        if (msg.hasMedia && (msg.type === 'ptt' || msg.type === 'audio')) {
            console.log('Baixando áudio do WhatsApp...');
            
            // 1. Baixa a mídia do WhatsApp Web
            const media: MessageMedia = await msg.downloadMedia();
            
            if (!media || !media.data) return;

            // 2. Salva temporariamente no disco em formato .ogg / .opus
            const tempFilePath = path.join(__dirname, `temp_${Date.now()}.ogg`);
            fs.writeFileSync(tempFilePath, media.data, 'base64');

            // 3. Envia o áudio para o Whisper na Groq transcrever
            const transcription = await groq.audio.transcriptions.create({
                file: fs.createReadStream(tempFilePath),
                model: 'whisper-large-v3',
                language: 'pt', // Força o idioma para português
                response_format: 'json',
            });

            // Apaga o arquivo temporário
            fs.unlinkSync(tempFilePath);

            const textoTranscrit = transcription.text;
            console.log(`Texto transcrito: "${textoTranscrit}"`);

            if (!textoTranscrit.trim()) return;

            // 4. Envia o texto da transcrição para o Qwen responder
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: 'system',
                        content: 'Você é um assistente atencioso do WhatsApp. Responda de forma sucinta e amigável.'
                    },
                    {
                        role: 'user',
                        content: textoTranscrit
                    }
                ],
                model: 'qwen-2.5-32b', // Ou outro checkpoint do Qwen disponível no Groq Console
            });

            const respostaIA = chatCompletion.choices[0]?.message?.content;

            if (respostaIA) {
                await msg.reply(respostaIA);
            }
        }
    } catch (error) {
        console.error('Erro ao processar o áudio com Groq:', error);
    }
});