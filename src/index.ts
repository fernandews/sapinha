import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'; // <--- 1. Adicione esta importação
import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { Command } from './@types/command';
import { gerarRespostaSapinha } from './services/groq';
import { adicionarMensagemAoHistorico, obterHistoricoGrupo } from './services/history';

const client = new Client({
    authStrategy: new LocalAuth(),
    // Trava a versão do WhatsApp Web para uma versão estável e compatível 🐸🛡️
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018919647-alpha.html',
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

let botLid: string | null = null;
let botNumber: string | null = null;

// Eventos do WhatsApp Client
client.on('qr', (qr: string) => {
    console.log('📱 Escaneie o QR Code abaixo com o WhatsApp Business:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', async () => {
    console.log('🐸 Sapinha está online e pronta!');

    botNumber = client.info?.wid?.user || null;

    // Busca o LID direto da memória do WhatsApp Web no navegador
    try {
        botLid = await (client as any).pupPage.evaluate(() => {
            // @ts-ignore
            return window.Store?.Lid?.getMeLid()?._serialized || window.Store?.Conn?.wid?._serialized;
        });
        console.log(`📱 Informações do Bot -> Número: ${botNumber} | LID: ${botLid}`);
    } catch (err) {
        console.warn('Não foi possível obter o LID automaticamente:', err);
    }
});

client.on('message', async (msg: Message) => {
    const groupId = msg.from;
    // 1. Ignores mensagens vazias
    const body = msg.body?.trim();
    if (!body) return;

    // 2. Trava de Grupo: Garante que o chat é um grupo 🐸🛡️✨
    const isGroup = msg.from.endsWith('@g.us');
    if (!isGroup) return;

    const args = body.split(/ +/);
    const trigger = args.shift()?.toLowerCase();

    // 3. Execução dos Comandos
    if (trigger && commands.has(trigger)) {
        try {
            const command = commands.get(trigger);

            if (command) {
                // Checagem de Administradora (adminOnly)
                if (command.adminOnly) {
                    const chat = await client.getChatById(msg.from);
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
    const rawData = (msg as any)._data;
    if (!body.startsWith('!')) {
        adicionarMensagemAoHistorico(groupId, 'user', body);
    }

    // Lista de menções na mensagem (array de IDs)
    const mentionedJids: string[] = rawData?.mentionedJidList || msg.mentionedIds || [];

    // Checa se algum dos IDs mencionados bate com o número ou com o LID da Sapinha 🐸🛡️
    const foiMencionada = mentionedJids.some((jid) => {
        if (!jid) return false;
        // 1. Confere contra o LID capturado
        if (botLid && jid.includes(botLid.replace('@lid', ''))) return true;
        // 2. Confere contra o número de telefone
        if (botNumber && jid.includes(botNumber)) return true;
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
            Boolean(botNumber && participant?.includes(botNumber)) ||
            // c) O autor da mensagem citada for o LID do bot
            Boolean(botLid && participant?.includes(botLid.replace('@lid', ''))) ||
            // d) O participante citado for o LID fixo do ambiente
            Boolean(participant?.includes('93764269928629'));
    }
    console.log(`💬 Mensagem recebida: "${body}" | Mencionada: ${foiMencionada} | Respondida: ${foiRespondida}`);

    // Dispara a resposta da IA 💖
    if (foiMencionada || foiRespondida) {
        try {
            console.log('🐸✨ A Sapinha foi chamada! Gerando resposta com contexto...');
            let mensagemLimpa = body.replace(/@\d+/g, '').trim() || 'Oi, sapinha!';

            // Resgata o contexto do grupo
            const historicoContexto = obterHistoricoGrupo(groupId);
            // Gera a resposta com contexto
            const respostaIA = await gerarRespostaSapinha(mensagemLimpa, historicoContexto);
            console.log(`💬 Resposta da IA: "${respostaIA}"`);
            // Adiciona a resposta da Sapinha ao histórico para ela se lembrar do que falou
            adicionarMensagemAoHistorico(groupId, 'assistant', respostaIA);

            await msg.reply(respostaIA);;
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