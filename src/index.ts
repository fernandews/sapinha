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
import { iaFoiChamada } from './utils/iaFoiChamada';

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

let commands: Map<string, Command> = new Map();
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
    console.log(`Mensagem recebida de ${groupId}: ${msg}`);
    if (iaFoiChamada(msg)) {
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
    commands = await loadCommands();
    await client.initialize();
};

startApp().catch((err) => console.error('Erro na inicialização do bot:', err));