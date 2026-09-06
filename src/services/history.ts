interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

// Guarda o histórico dos últimos chats na memória (GroupID -> Array de Mensagens)
const chatHistories = new Map<string, ChatMessage[]>();

const MAX_HISTORY = 3; // Mantém as últimas 10 mensagens para contexto

export function adicionarMensagemAoHistorico(groupId: string, role: 'user' | 'assistant', content: string) {
    if (!chatHistories.has(groupId)) {
        chatHistories.set(groupId, []);
    }

    const history = chatHistories.get(groupId)!;
    history.push({ role, content });

    // Mantém apenas o limite definido
    if (history.length > MAX_HISTORY) {
        history.shift();
    }
}

export function obterHistoricoGrupo(groupId: string): ChatMessage[] {
    return chatHistories.get(groupId) || [];
}