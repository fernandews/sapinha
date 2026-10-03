import { SapinhaMessage } from "../@types/whatsapp";

export const isUnwantedMessage = (msg: SapinhaMessage): boolean => {
    const isGroup = msg.from.endsWith('@g.us');
    const semkkk = msg.body.replace(/k{2,}/gi, '').trim();
    const semMarcacao = semkkk.replace(/@\d+/g, '').trim();
    const semEmojisEspeciais = semMarcacao.replace(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}(\u200d\p{Emoji})*/gu, '').trim();
    const semTodos = semEmojisEspeciais.replace(/@(?!all\b)\d+/g, '').trim();

    const temTexto = semTodos.length > 0;

    return !isGroup || !temTexto;
};