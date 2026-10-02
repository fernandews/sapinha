import fs from 'fs';
import { Command } from '../@types/command';
import { reapresentacaoCommand, reapresentacao } from '../content/reapresentacaoData';

const reapresentacaoCommandImplement: Command = {
    ...reapresentacaoCommand,

    async execute(msg, client, args) {
        const media = fs.readFileSync(reapresentacao.imagem);
        await client.sendMessage(msg.from, { image: media });
        return;
    }
};

export default reapresentacaoCommandImplement;