import 'dotenv/config';
import { Client, GroupChat, LocalAuth, Message, MessageMedia } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { Command } from './@types/command';
import { adicionarMensagemAoHistorico } from './services/history';
import { processarMensagem } from './listeners/messageHandler';
import { loadCommands } from './utils/loadCommands';
import { isUnwantedMessage } from './utils/isUnwantedMessages';
import { processCommand } from './utils/processCommand';
import { clientState } from './services/clientState';
import { iaFoiChamada } from './utils/iaFoiChamada';

import http from 'http';

// Servidor minimalista para a Render/UptimeRobot checarem que o bot está vivo
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('🐸 Sapinha está viva!');
}).listen(PORT, () => {
    console.log(`🌐 Servidor HTTP rodando na porta ${PORT}`);
});

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
    clientState.setMainChat(chats.find((chat) => chat.isGroup && chat.name.includes('teste')) as GroupChat | null);
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

    if (iaFoiChamada(msg)) {
        try {
            await processarMensagem(msg, groupId);
        } catch (error) {
            console.error('Erro ao gerar resposta da IA:', error);
            await msg.reply('🐸💔 A sapinha deu uma moscada aqui! Tenta me chamar de novo? ✨');
        }
    }
});

client.on('group_join', async (notification) => {
    try {
        const media = MessageMedia.fromFilePath('./src/assets/bem-vindas.jpeg');
        await client.sendMessage(notification.chatId, media);
                
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem de boas-vindas:', error);
    }
});

// Inicialização da aplicação
const startApp = async () => {
    commands = await loadCommands();
    await client.initialize();
};

startApp().catch((err) => console.error('Erro na inicialização do bot:', err));

// Tratadores de Exceção Globais (Evita queda do processo Node)
process.on('unhandledRejection', (reason) => {
    console.error('Promessa não tratada capturada:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Exceção não tratada capturada:', err);
});