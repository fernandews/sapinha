import { Command } from '../@types/command';

const menuCommand: Command = {
    name: 'Menu de Comandos',
    description: 'Exibe a lista de todos os comandos disponíveis',
    triggers: ['!menu', '!help', '!comandos'],

    async execute(msg, client, args, commandsMap) {
        let menuTexto = '🐸🌈 *MENU DA SAPINHA* ✨💕\n\n';
        menuTexto += 'Confira tudo o que eu sei fazer por aqui, amigue! ✨\n\n';

        // Guarda os comandos já processados para não repetir (caso um comando tenha vários triggers)
        const comandosUnicos = new Set<Command>();

        if (commandsMap) {
            commandsMap.forEach((cmd) => comandosUnicos.add(cmd));

            comandosUnicos.forEach((cmd) => {
                const gatilhos = cmd.triggers.join(', ');
                menuTexto += `✨ *${gatilhos}*\n`;
                menuTexto += `└ 💬 ${cmd.description}\n\n`;
            });
        }

        menuTexto += '💖 *Dica:* É só digitar qualquer um dos comandos acima no chat! 🐸✨';

        await msg.reply(menuTexto);
    }
};

export default menuCommand;