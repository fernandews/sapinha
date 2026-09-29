import { WASocket, WAMessage } from '@whiskeysockets/baileys';

export interface SapinhaMessage {
    original: WAMessage;
    body: string;
    from: string;
    author?: string;
    type: string;
    mimeType?: string;
    mentionedIds: string[];
    hasMedia: boolean;
    hasQuotedMsg: boolean;
    reply: (text: string) => Promise<WAMessage | undefined>;
    getQuotedMessage: () => Promise<SapinhaMessage | null>;
}

export function getMessageContent(message: WAMessage) {
    let content = message.message;

    while (content) {
        const wrapped = content.ephemeralMessage?.message ??
            content.viewOnceMessage?.message ??
            content.viewOnceMessageV2?.message ??
            content.viewOnceMessageV2Extension?.message;

        if (!wrapped) break;
        content = wrapped;
    }

    return content;
}

export function createSapinhaMessage(sock: WASocket, original: WAMessage): SapinhaMessage {
    const content = getMessageContent(original);
    const body = content?.conversation ??
        content?.extendedTextMessage?.text ??
        content?.imageMessage?.caption ??
        content?.videoMessage?.caption ??
        content?.documentMessage?.caption ?? '';
    const type = content?.audioMessage?.ptt
        ? 'ptt'
        : content?.audioMessage
            ? 'audio'
            : content?.imageMessage
                ? 'image'
                : content?.stickerMessage
                    ? 'sticker'
                    : '';
    const media = content?.imageMessage ?? content?.audioMessage ?? content?.stickerMessage;
    const contextInfo = content?.extendedTextMessage?.contextInfo ??
        content?.imageMessage?.contextInfo ??
        content?.videoMessage?.contextInfo ??
        content?.audioMessage?.contextInfo ??
        content?.documentMessage?.contextInfo ??
        content?.stickerMessage?.contextInfo;
    const from = original.key.remoteJid ?? '';

    const message: SapinhaMessage = {
        original,
        body,
        from,
        author: original.key.participant ?? undefined,
        type,
        mimeType: media?.mimetype ?? (type === 'sticker' ? 'image/webp' : type === 'image' ? 'image/jpeg' : type ? 'audio/ogg' : undefined),
        mentionedIds: contextInfo?.mentionedJid ?? [],
        hasMedia: Boolean(media),
        hasQuotedMsg: Boolean(contextInfo?.stanzaId),
        reply: (text) => sock.sendMessage(from, { text }, { quoted: original }),
        getQuotedMessage: async () => {
            if (!contextInfo?.stanzaId) return null;

            const quoted: WAMessage = {
                key: {
                    remoteJid: from,
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant ?? undefined,
                    fromMe: contextInfo.participant === sock.user?.id,
                },
                message: contextInfo.quotedMessage ?? undefined,
                messageTimestamp: original.messageTimestamp,
                pushName: original.pushName,
            };

            return createSapinhaMessage(sock, quoted);
        },
    };

    return message;
}