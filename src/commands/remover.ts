import { Command } from '../@types/command';

const banCommand: Command = {
    name: 'Remover Membro',
    description: 'Remove um usuário do grupo (exclusivo para ADMs)',
    triggers: ['!ban', '!remover'],
    adminOnly: true, // <--- Protegido! Apenas ADMs podem usar 🐸🛡️✨

    async execute(msg, client, args) {
        const chat = await msg.getChat();
        let usuarioParaBanir: string | undefined;

        // 1. Verifica se o comando foi enviado respondendo a uma mensagem
        if (msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();
            usuarioParaBanir = quotedMsg.author || quotedMsg.from;
        } 
        // 2. Ou se o usuário foi mencionado na mensagem (ex: !ban @user)
        else if (msg.mentionedIds && msg.mentionedIds.length > 0) {
            usuarioParaBanir = msg.mentionedIds[0];
        }

        if (!usuarioParaBanir) {
            await msg.reply('🐸💕 Marque a pessoa ou responda à mensagem de quem você quer remover com *!ban*, tá bom? ✨');
            return;
        }

        try {
            // Instância do chat do grupo no whatsapp-web.js
            const groupChat = chat as any;
            await groupChat.removeParticipants([usuarioParaBanir]);
            await msg.reply('🐸🧹🌈✨');
        } catch (error) {
            console.error('Erro ao remover usuário:', error);
            await msg.reply('❌ Vish! Verifique se eu tenho permissão de ADM no grupo... 🐸💔');
        }
    }
};

export default banCommand;