import { clientState } from "../services/clientState";

export const processCommand = async (msg: any, client: any, commands: Map<string, any>, trigger: string) => {
    const args = msg.body?.split(/ +/);
    try {
        const command = commands.get(trigger);

        if (command) {
            // Checagem de Administradora (adminOnly)
            if (command.adminOnly) {
                const contacts = await client.getContactLidAndPhone([msg.author || '']);
                const pn = contacts[0].pn;
                const participant = clientState.mainChat()?.participants.find(
                    (p: any) => p.id._serialized === pn
                );
                
                const isAdmin = participant?.isAdmin || participant?.isSuperAdmin;

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