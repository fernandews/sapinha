import { MessageMedia } from 'whatsapp-web.js';
import { stateIA } from '../services/aiState';
import { gerarRespostaSapinha } from '../services/groq';
import { adicionarMensagemAoHistorico, obterHistoricoGrupo } from '../services/history';
import path from 'path/win32';
import * as fs from 'fs';
import Groq from 'groq-sdk';
import { processarAudio } from './audioHandler';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function processarMensagem(message: any, groupId: string) {
    // Trava: Se a IA estiver desativada, ignora o processamento pela Groq
    if (!stateIA.isAtiva()) {
        console.log('A IA está desativada. Ignorando processamento da mensagem.');
        await message.reply(`🐸 A Sapinha está dormindo no momento. Porque você não conversa com uma pessoa mesmo? ✨💖`);
        return;
    }

    //IA Ativada: Processa a mensagem com a Groq (Whisper + Qwen)
    try {
        const historicoContexto = obterHistoricoGrupo(groupId);
        if (message.hasMedia && (message.type === 'ptt' || message.type === 'audio')) {
            console.log('Mensagem de áudio recebida. Processando com Groq...');
            const textoTranscrit = await processarAudio(message, message.client);
            if (!textoTranscrit) return;

            adicionarMensagemAoHistorico(groupId, 'user', textoTranscrit);
            const resposta = await gerarRespostaSapinha(textoTranscrit, historicoContexto);
            adicionarMensagemAoHistorico(groupId, 'assistant', resposta);

            if (resposta) {
                await message.reply(resposta);
                return;
            }
        }

        const texto = message.body?.trim().toLowerCase();
        adicionarMensagemAoHistorico(groupId, 'user', texto);
        const resposta = await gerarRespostaSapinha(texto, historicoContexto);
        adicionarMensagemAoHistorico(groupId, 'assistant', resposta);
        await message.reply(resposta);
    } catch (error) {
        console.error('Erro ao processar o áudio com Groq:', error);
    }

}