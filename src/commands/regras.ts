import { Command } from '../@types/command';
import { regrasCommand, regrasResposta } from '../content/regrasData';

const regrasCommandImplement: Command = {
    ...regrasCommand,

    async execute(msg, client, args) {
        await msg.reply(regrasResposta);
    }
};

export default regrasCommandImplement;