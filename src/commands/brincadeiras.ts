import { Command } from '../@types/command';
import { brincadeirasCommand, brincadeirasMenu, brincadeirasMenuPS, brincadeirasOptions } from '../content/brincadeirasData';

const brincadeirasCommandImplement: Command = {
    ...brincadeirasCommand,

    async execute(msg, client, args) {
        if (args.length === 0) {
            let menu = brincadeirasMenu;
            for (const [chave, item] of Object.entries(brincadeirasOptions)) {
                menu += `*!brincadeira ${chave}* - ${item.titulo}\n`;
            }
            menu += brincadeirasMenuPS;
            await msg.reply(menu);
            return;
        }

        const opcao = args[0];
        const brincadeira = brincadeirasOptions[opcao as keyof typeof brincadeirasOptions];

        if (brincadeira) {
            await msg.reply(brincadeira.texto);
            return;
        }

        await msg.reply('❌ Opção inválida! Digite *!brincadeiras* para ver o menu.');
    }
};

export default brincadeirasCommandImplement;