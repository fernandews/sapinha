export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Guarda o histórico dos chats na memória (GroupID -> Array de Mensagens)
const chatHistories = new Map<string, ChatMessage[]>();

const MAX_HISTORY = 10; // Mantém as últimas 10 mensagens para contexto

export function adicionarMensagemAoHistorico(groupId: string, role: 'user' | 'assistant', content: string) {
    if (!chatHistories.has(groupId)) {
        chatHistories.set(groupId, []);
    }

    const history = chatHistories.get(groupId)!;
    history.push({ role, content });

    // Mantém apenas o limite definido
    while (history.length > MAX_HISTORY) {
        history.shift();
    }

    // Garante que o histórico armazenado nunca comece com 'assistant'
    while (history.length > 0 && history[0].role === 'assistant') {
        history.shift();
    }
}

export function obterHistoricoGrupo(groupId: string): ChatMessage[] {
    const history = chatHistories.get(groupId) || [];

    // Dupla validação para garantir que o array retornado sempre comece com 'user'
    let startIndex = 0;
    while (startIndex < history.length && history[startIndex].role === 'assistant') {
        startIndex++;
    }

    return history.slice(startIndex);
}

export function limparHistoricoGrupo(groupId: string): void {
    chatHistories.delete(groupId);
}