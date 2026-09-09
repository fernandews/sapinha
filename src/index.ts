import 'dotenv/config';
import { Client, GroupChat, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { Command } from './@types/command';
import { adicionarMensagemAoHistorico } from './services/history';
import { processarMensagem } from './listeners/messageHandler';
import { loadCommands } from './utils/loadCommands';
import { isUnwantedMessage } from './utils/isUnwantedMessages';
import { processCommand } from './utils/processCommand';
import { clientState } from './services/clientState';

const client = new Client({
    authStrategy: new LocalAuth(),
    // Trava a versão do WhatsApp Web para uma versão estável e compatível 🐸🛡️
    webVersionCache: {
        type: 'none',
    },
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
    }
});

const commands = await loadCommands();

// Eventos do WhatsApp Client
client.on('qr', (qr: string) => {
    console.log('📱 Escaneie o QR Code abaixo com o WhatsApp Business:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('🐸 Sapinha está pronta!');

    const chats = await client.getChats();
    clientState.setMainChat(chats.find((chat) => chat.isGroup && chat.name.includes('NUMASAPA')) as GroupChat | null);
    clientState.setBotNumber(client.info?.wid?.user || "");
});

client.on('message', async (msg: Message) => {
    if (isUnwantedMessage(msg)) return;
    const groupId = msg.from;

    const args = msg.body?.split(/ +/);
    const trigger = args?.shift()?.toLowerCase();
    if (trigger && commands.has(trigger)) {
        await processCommand(msg, client, commands, trigger);
    }

    // 4. Espaço reservado para a IA (Groq/Llama) responder conversas normais no grupo 🐸🌈✨
    const rawData = (msg as any)._data;
    const body = msg.body?.trim();
    if (!body.startsWith('!')) {
        adicionarMensagemAoHistorico(groupId, 'user', body);
    }

    // Lista de menções na mensagem (array de IDs)
    const mentionedJids: string[] = rawData?.mentionedJidList || msg.mentionedIds || [];

    // Checa se algum dos IDs mencionados bate com o número ou com o LID da Sapinha 🐸🛡️
    const foiMencionada = mentionedJids.some((jid) => {
        if (!jid) return false;
        // 1. Confere contra o LID capturado
        if (clientState.botLid() && jid.includes(clientState.botLid().replace('@lid', ''))) return true;
        // 2. Confere contra o número de telefone
        if (clientState.botNumber() && jid.includes(clientState.botNumber())) return true;
        // 3. Confere o LID que você viu nos logs (fallback)
        if (jid.includes('93764269928629')) return true;
        
        return false;
    });

    // Checa se responderam a uma mensagem da Sapinha
    let foiRespondida = false;
    if (msg.hasQuotedMsg && rawData?.quotedMsg) {
        const q = rawData.quotedMsg;
        const participant = rawData.quotedParticipant || q.author || q.from;

        // A mensagem citada pertence à Sapinha se:
        foiRespondida = 
            // a) O indicador nativo de autoria do bot for verdadeiro
            Boolean(q.fromMe) || 
            // b) O autor da mensagem citada for o número do bot
            Boolean(clientState.botNumber() && participant?.includes(clientState.botNumber())) ||
            // c) O autor da mensagem citada for o LID do bot
            Boolean(clientState.botLid() && participant?.includes(clientState.botLid().replace('@lid', ''))) ||
            // d) O participante citado for o LID fixo do ambiente
            Boolean(participant?.includes('93764269928629'));
    }

    if (foiMencionada || foiRespondida) {
        try {
            await processarMensagem(msg, groupId);
        } catch (error) {
            console.error('Erro ao gerar resposta da IA:', error);
            await msg.reply('🐸💔 A sapinha deu uma moscada aqui! Tenta me chamar de novo? ✨');
        }
    }
});

// Inicialização da aplicação
const startApp = async () => {
    await loadCommands();
    await client.initialize();
};

startApp().catch((err) => console.error('Erro na inicialização do bot:', err));