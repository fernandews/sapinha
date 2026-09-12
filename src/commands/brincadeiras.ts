import { MessageMedia } from 'whatsapp-web.js';
import { Command } from '../@types/command';
import { brincadeirasCommand, brincadeirasMenu, brincadeirasMenuPS, brincadeirasOptions } from '../content/brincadeirasData';

const brincadeirasCommandImplement: Command = {
    ...brincadeirasCommand,

    async execute(msg, client, args) {
        if (args.length === 1) {
            console.log('Comando de brincadeiras chamado sem argumentos. Exibindo menu.');
            let menu = brincadeirasMenu;
            for (const [chave, item] of Object.entries(brincadeirasOptions)) {
                menu += `*!brincadeira ${chave}* - ${item.titulo}\n`;
            }
            menu += brincadeirasMenuPS;
            await msg.reply(menu);
            return;
        }

        const opcao = args[1];
        const brincadeira = brincadeirasOptions[opcao as keyof typeof brincadeirasOptions];

        if (brincadeira) {
            const media = MessageMedia.fromFilePath(brincadeira.imagem);
            await client.sendMessage(msg.from, media);
            return;
        }

        await msg.reply('❌ Opção inválida! Digite *!brincadeiras* para ver o menu.');
    }
};

export default brincadeirasCommandImplement;