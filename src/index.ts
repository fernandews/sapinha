import 'dotenv/config';
import makeWASocket, { 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    WASocket 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import http from 'http';
import fs from 'fs';
import path from 'path';

import { Command } from './@types/command';
import { processarMensagem } from './listeners/messageHandler';
import { loadCommands } from './utils/loadCommands';
import { isUnwantedMessage } from './utils/isUnwantedMessages';
import { processCommand } from './utils/processCommand';
import { clientState } from './services/clientState';
import { iaFoiChamada } from './utils/iaFoiChamada';
import { createSapinhaMessage } from './@types/whatsapp';

// Servidor minimalista para UptimeRobot / checagem de saúde da aplicação
const PORT = process.env.PORT || 3000;
http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('🐸 Sapinha está viva!');
});

let commands: Map<string, Command> = new Map();

async function startApp() {
    // Carrega a coleção de comandos da aplicação
    commands = await loadCommands();

    // 1. Gerenciamento de estado e credenciais de sessão do Baileys
    const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');
    const { version } = await fetchLatestBaileysVersion();

    // 2. Inicialização do Socket do WhatsApp em Node.js puro (sem Chromium/Puppeteer)
    const sock: WASocket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['Sapinha Bot', 'Chrome', '1.0.0']
    });

    // Salva atualizações de chaves/sessão
    sock.ev.on('creds.update', saveCreds);

    // 3. Gerenciamento de Conexão e Exibição de QR Code
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log('📱 Escaneie o QR Code abaixo com o WhatsApp:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`🔌 Conexão fechada. Motivo: ${statusCode}. Reconectando...`, shouldReconnect);
            
            if (shouldReconnect) {
                startApp();
            } else {
                console.log('❌ Sessão encerrada/desconectada no celular. Apague a pasta "baileys_auth_info" e reinicie para ler o QR Code novamente.');
            }
        } else if (connection === 'open') {
            console.log('🐸 Sapinha está pronta e conectada via Baileys (sem navegador)! ✨');
            
            // Define o número do bot no clientState
            const botNumber = sock.user?.id ? sock.user.id.split(':')[0] : '';
            clientState.setBotNumber(botNumber);
        }
    });

    // 4. Escuta e Processamento de Mensagens Recebidas
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        for (const msg of messages) {
            if (!msg.message || msg.key.fromMe) continue;
            const message = createSapinhaMessage(sock, msg);
            if (isUnwantedMessage(message)) continue;

            const groupId = message.from;
            const body = message.body;

            const args = body.trim().split(/ +/);
            const trigger = args.shift()?.toLowerCase();    
            if (trigger && commands.has(trigger)) {
                console.log(`[Comando] Trigger capturado: ${trigger}`);
                // Repassa o objeto sock para manter interface compatível no processCommand
                await processCommand(message, sock, commands, trigger);
            }

            if (iaFoiChamada(message)) {
                try {
                    await processarMensagem(message);
                } catch (error) {
                    console.error('Erro ao gerar resposta da IA:', error);
                    await sock.sendMessage(groupId, { 
                        text: '🐸💔 A sapinha deu uma moscada aqui! Tenta me chamar de novo? ✨' 
                    }, { quoted: msg });
                }
            }
        }
    });

    // 5. Evento de Boas-Vindas quando alguém entra em um grupo
    sock.ev.on('group-participants.update', async (notification) => {
        const { id: chatId, participants, action } = notification;

        if (action === 'add') {
            try {
                const imagePath = path.resolve('./src/assets/bem-vindas.jpeg');
                
                if (fs.existsSync(imagePath)) {
                    const imageBuffer = fs.readFileSync(imagePath);
                    
                    for (const participant of participants) {
                        const { id: participantId } = participant;
                        await sock.sendMessage(chatId, {
                            image: imageBuffer,
                            caption: `🐸✨ Seja bem-vinda ao grupo, @${participantId.split('@')[0]}!`,
                            mentions: [participantId]
                        });
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao enviar mensagem de boas-vindas:', error);
            }
        }
    });
}

// Inicialização da aplicação
startApp().catch((err) => console.error('Erro na inicialização do bot:', err));

// Tratadores Globais de Exceção (Garante resiliência e previne queda do processo Node)
process.on('unhandledRejection', (reason) => {
    console.error('Promessa não tratada capturada:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('Exceção não tratada capturada:', err);
});