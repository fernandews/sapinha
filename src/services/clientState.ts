import { GroupMetadata } from '@whiskeysockets/baileys';

let botLid: string = '';
let botNumber: string = '';
let mainChat: GroupMetadata | null = null;

export const clientState = {
    mainChat: () => mainChat,
    setMainChat: (chat: GroupMetadata | null) => { mainChat = chat; },
    botLid: () => botLid,
    setBotLid: (lid: string) => { botLid = lid; },
    botNumber: () => botNumber,
    setBotNumber: (number: string) => { botNumber = number; },
};