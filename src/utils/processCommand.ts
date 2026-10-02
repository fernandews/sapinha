import { clientState } from "../services/clientState";
import { WASocket } from '@whiskeysockets/baileys';
import { SapinhaMessage } from '../@types/whatsapp';

export const processCommand = async (msg: SapinhaMessage, client: WASocket, commands: Map<string, any>, trigger: string) => {
    const args = msg.body.split(/ +/);
    try {
        const command = commands.get(trigger);

        if (command) {
            // Checagem de Administradora (adminOnly)
            if (command.adminOnly) {
                const participant = msg.author
                    ? clientState.mainChat()?.participants.find(
                        (p) => p.id === msg.author || p.lid === msg.author || p.phoneNumber === msg.author
                    )
                    : undefined;

                const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

                if (!isAdmin) {
                    await msg.reply('🐸🚫 Oops, Esse comando é exclusivo para as administradoras do grupo! 💕✨');
                    return;
                }
            }

            // Executa o comando
            await command.execute(msg, client, args, commands);
        }
    } catch (error) {
        console.error(`Erro ao executar o comando ${trigger}:`, error);
        await msg.reply('❌ Ocorreu um erro ao executar esse comando.');
    }
    return;
}