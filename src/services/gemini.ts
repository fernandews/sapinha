import { SAPINHA_SYSTEM_PROMPT } from '../content/systemPrompts';
import { ChatMessage } from '../@types/chatMessage';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Message, MessageMedia } from 'whatsapp-web.js';

// 1. Inicializa o SDK do Gemini
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error('ERRO: A variável de ambiente GEMINI_API_KEY não foi configurada!');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    systemInstruction: SAPINHA_SYSTEM_PROMPT,
});

function obterPromptPadrao(msg: Message): string {
    if (msg.body && msg.body.trim().length > 0) {
        return msg.body;
    }

    switch (msg.type) {
        case 'ptt':
        case 'audio':
            return 'Escute este áudio do WhatsApp, transcreva e responda à dúvida ou solicitação do usuário.';
        case 'sticker':
            return 'Interprete o humor, texto ou meme contido nesta figurinha do WhatsApp e faça um comentário curto e divertido.';
        case 'image':
            return 'Analise o conteúdo desta imagem e descreva o que vê ou responda ao contexto.';
        default:
            return 'Responda de forma amigável.';
    }
}

export interface MidiaPart {
    inlineData: {
        data: string;
        mimeType: string;
    };
}

export async function gerarRespostaSapinha(
    mensagemAtual: string,
    historico: ChatMessage[],
    midias: MidiaPart[] = [] // Aceita mídias da mensagem atual e/ou quoted
): Promise<string> {
    try {
        // 1. Inicializa o modelo com a instrução do sistema (Sapinha System Prompt)
        const model = genAI.getGenerativeModel({
            model: 'models/gemini-3.5-flash-lite',
            systemInstruction: SAPINHA_SYSTEM_PROMPT,
        });

        // 2. Mapeia o histórico para o formato esperado pelo Gemini ('user' | 'model')
        const contentsHistory = historico.map((m) => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        // 3. Monta o bloco da mensagem atual (Texto/Prompt + Mídias se houver)
        const currentParts: Array<{ text: string } | MidiaPart> = [];

        // Adiciona texto da mensagem atual ou prompt genérico
        if (mensagemAtual && mensagemAtual.trim()) {
            currentParts.push({ text: mensagemAtual });
        } else if (midias.length > 0) {
            currentParts.push({ text: 'Interprete a mídia enviada e responda no seu estilo.' });
        }

        // Adiciona mídias (áudio, foto, figurinha da mensagem ou do quoted)
        midias.forEach((m) => currentParts.push(m));

        // 4. Inicia o Chat com o histórico de mensagens acumulado
        const chat = model.startChat({
            history: contentsHistory,
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500,
            },
        });

        // 5. Envia a mensagem/mídias atuais mantendo o histórico
        const result = await chat.sendMessage(currentParts);
        let resposta = result.response.text();

        resposta = resposta.trim();
        console.log('💬 Resposta do Gemini (Sapinha):', resposta);

        return resposta || '🐸✨ Ops, a sapinha deu uma moscada! 💕';

    } catch (error) {
        console.error('Erro na chamada do Gemini:', error);
        return '🐸💔 Poxa, a sapinha teve um probleminha para pensar agora! ✨';
    }
}