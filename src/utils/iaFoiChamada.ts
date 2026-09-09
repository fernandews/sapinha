import { clientState } from "../services/clientState";


export const iaFoiChamada = (msg: any) => {
    const rawData = (msg as any)._data;
    const mentionedJids: string[] = rawData?.mentionedJidList || msg.mentionedIds || [];

    const foiMencionada = mentionedJids.some((jid) => {
        if (!jid) return false;
        // 1. Confere contra o LID capturado
        if (clientState.botLid() && jid.includes(clientState.botLid().replace('@lid', ''))) return true;
        // 2. Confere contra o número de telefone
        if (clientState.botNumber() && jid.includes(clientState.botNumber())) return true;
        // 3. Confere o LID que você viu nos logs (fallback)
        if (jid.includes('93764269928629')) return true;
        
        return false;
    });

    // Checa se responderam a uma mensagem da Sapinha
    let foiRespondida = false;
    if (msg.hasQuotedMsg && rawData?.quotedMsg) {
        const q = rawData.quotedMsg;
        const participant = rawData.quotedParticipant || q.author || q.from;

        // A mensagem citada pertence à Sapinha se:
        foiRespondida = 
            // a) O indicador nativo de autoria do bot for verdadeiro
            Boolean(q.fromMe) || 
            // b) O autor da mensagem citada for o número do bot
            Boolean(clientState.botNumber() && participant?.includes(clientState.botNumber())) ||
            // c) O autor da mensagem citada for o LID do bot
            Boolean(clientState.botLid() && participant?.includes(clientState.botLid().replace('@lid', ''))) ||
            // d) O participante citado for o LID fixo do ambiente
            Boolean(participant?.includes('93764269928629'));
    }

    return foiMencionada || foiRespondida;
};