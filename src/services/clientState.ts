import { GroupChat } from "whatsapp-web.js";

let botLid: string = '';
let botNumber: string = '';
let mainChat: GroupChat | null = null;

export const clientState = {
    mainChat: () => mainChat,
    setMainChat: (chat: GroupChat | null) => { mainChat = chat; },
    botLid: () => botLid,
    setBotLid: (lid: string) => { botLid = lid; },
    botNumber: () => botNumber,
    setBotNumber: (number: string) => { botNumber = number; },
};