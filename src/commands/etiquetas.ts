import { Command } from '../@types/command';
import { passoAPassoEtiquetas } from '../content/etiquetasData';

const etiquetasCommand: Command = {
    name: 'Etiquetas',
    description: 'Explica como adicionar uma etiqueta de membro no grupo',
    triggers: ['!etiquetas', '!etiqueta'],

    async execute(msg) {
        await msg.reply(passoAPassoEtiquetas);
    },
};

export default etiquetasCommand;
