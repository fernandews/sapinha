import Groq from 'groq-sdk';
import { SAPINHA_SYSTEM_PROMPT } from '../content/systemPrompts.ts';
import { ChatMessage } from '../@types/chatMessage';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

export async function gerarRespostaSapinha(mensagemAtual: string, historico: ChatMessage[]): Promise<string> {
    try {
        // Monta o array final com System Prompt + Histórico Recente
        const messages = [
            {
                role: 'system' as const,
                content: SAPINHA_SYSTEM_PROMPT,
            },
            ...historico.map((m) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
            })),
        ];

        const chatCompletion = await groq.chat.completions.create({
            messages,
            model: 'qwen/qwen3.6-27b',
            temperature: 0.7,
            max_tokens: 500,
            reasoning_effort: "none",
        });

        let resposta = chatCompletion.choices[0]?.message?.content || '🐸✨ Ops, a sapinha deu uma moscada! 💕';

        console.log(resposta)
        // Filtro de limpeza do modelo)
        resposta = resposta.replace(/<think>[\s\S]*?<\/think>/gi, '');
        resposta = resposta.replace(/<think>[\s\S]*/gi, '');
        resposta = resposta.trim();

        console.log('💬 Resposta da Groq:', resposta);

        return resposta;
    } catch (error) {
        console.log('Erro na chamada da Groq:', error);
        return '🐸💔 Poxa, a sapinha teve um probleminha para pensar agora! ✨';
    }
}