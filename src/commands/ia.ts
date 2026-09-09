import { Command } from '../@types/command';
import { iaMenu, iaOptions } from '../content/iaData';
import { stateIA } from '../services/aiState';
export const iaCommand = {
    name: 'IA',
    description: 'On/Off da IA (exclusivo para ADMs)',
    adminOnly: true,
    triggers: ['!ia', '!sapinha'],
}


const iaCommandImplement: Command = {
    ...iaCommand,

    async execute(msg, client, args) {
        if (args.length === 0) {
            let menu = iaMenu;
            for (const [chave, item] of Object.entries(iaOptions)) {
                menu += `*!sapinha ${chave}* - ${item.titulo}\n`;
            }
            await msg.reply(menu);
            return;
        }

        const opcao = args[0];
        const iaOption = iaOptions[opcao as keyof typeof iaOptions];
        // Comandos de Controle da IA

        if (iaOption) {
            switch (opcao) {
                case "off":
                    stateIA.desativar();
                    await msg.reply(iaOption.texto);
                    break;
                case "on":
                    stateIA.ativar();
                    await msg.reply(iaOption.texto);
                    break;
                case "status":
                    const status = stateIA.isAtiva() ? 'ON 🟢' : 'OFF 🔴';
                    await msg.reply(`🐸 Status da IA: *${status}*`);
                    break;
                default:
                    break;
            }
            return;
        }

        await msg.reply('❌ Opção inválida! Digite *!sapinha* para ver o menu.');
    }
};

export default iaCommandImplement;