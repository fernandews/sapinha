import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'; // <--- 1. Adicione esta importação
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { Command } from './@types/command';

const client: Client = new Client({
    authStrategy: new LocalAuth()
});

const commands = new Map<string, Command>();

const loadCommands = async (): Promise<void> => {
    const commandsPath = path.join(__dirname, 'commands');
    
    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️ Pasta de comandos não encontrada em:', commandsPath);
        return;
    }

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        // <--- 2. Converte o caminho do Windows (C:\...) para URL (file:///C:/...)
        const fileUrl = pathToFileURL(filePath).href;
        const commandModule = await import(fileUrl);
        
        const command: Command = commandModule.default || commandModule;

        if (command && command.triggers) {
            command.triggers.forEach((trigger) => {
                commands.set(trigger.toLowerCase(), command);
            });
            console.log(`✅ Comando carregado: ${command.name} [${command.triggers.join(', ')}]`);
        }
    }
};

// Eventos do WhatsApp Client
client.on('qr', (qr: string) => {
    console.log('📱 Escaneie o QR Code abaixo com o WhatsApp Business:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('🤖 Bot em TypeScript totalmente conectado e pronto para uso!');
});

client.on('message', async (msg: Message) => {
    // 1. Ignores mensagens vazias
    const body = msg.body?.trim();
    if (!body) return;

    // 2. Trava de Grupo: Garante que o chat é um grupo 🐸🛡️✨
    const chat = await msg.getChat();
    if (!chat.isGroup) {
        // Ignora mensagens enviadas no PV (não processa nem responde)
        return;
    }

    const args = body.split(/ +/);
    const trigger = args.shift()?.toLowerCase();

    if (!trigger) return;

    // 3. Execução dos Comandos
    if (commands.has(trigger)) {
        try {
            const command = commands.get(trigger);

            if (command) {
                // Checagem de Administradora (adminOnly)
                if (command.adminOnly) {
                    const groupChat = chat as any;
                    const authorId = msg.author || msg.from;

                    const participant = groupChat.participants.find(
                        (p: any) => p.id._serialized === authorId
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

    // 4. Espaço reservado para a IA (Groq/Llama) responder conversas normais no grupo 🐸🌈✨
});

// Inicialização da aplicação
const startApp = async () => {
    await loadCommands();
    await client.initialize();
};

startApp().catch((err) => console.error('Erro na inicialização do bot:', err));