import cron from 'node-cron';
import fs from 'fs/promises';
import path from 'path';
import { WASocket } from '@whiskeysockets/baileys';
import { clientState } from './clientState';

const TIME_ZONE = 'America/Sao_Paulo';
const weekdayImages: Record<string, string> = {
    monday: 'segunda.jpeg',
    tuesday: 'terca.jpeg',
    wednesday: 'quarta.jpeg',
    thursday: 'quinta.jpeg',
    friday: 'sexta.jpeg',
    saturday: 'sabado.jpeg',
    sunday: 'domingo.jpeg'
};
const saoPauloWeekday = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    weekday: 'long'
});
const saoPauloDateTime = new Intl.DateTimeFormat('pt-BR', {
    timeZone: TIME_ZONE,
    dateStyle: 'short',
    timeStyle: 'medium'
});

let activeSocket: WASocket | undefined;
let schedulesStarted = false;

async function sendImage(filename: string) {
    const triggeredAt = saoPauloDateTime.format(new Date());
    console.log(`[Agendamento] Disparo de ${filename} iniciado às ${triggeredAt} (${TIME_ZONE}).`);

    const socket = activeSocket;
    const mainChat = clientState.mainChat();
    if (!socket) {
        console.error(`[Agendamento] ${filename}: não enviado; nenhum socket ativo.`);
        return;
    }
    if (!mainChat?.id) {
        console.error(`[Agendamento] ${filename}: não enviado; clientState.mainChat está vazio.`);
        return;
    }

    const imagePath = path.resolve('src/assets/diarias', filename);
    let image: Buffer;
    try {
        image = await fs.readFile(imagePath);
    } catch (error) {
        console.error(`[Agendamento] Falha ao ler imagem ${filename} em ${imagePath}.`, error);
        return;
    }

    console.log(
        `[Agendamento] Enviando ${filename} (${image.length} bytes) para o grupo "${mainChat.subject}" (${mainChat.id}); socket ${socket.user?.id ?? 'sem ID'}.`
    );
    try {
        const sentMessage = await socket.sendMessage(mainChat.id, { image });
        console.log(
            `[Agendamento] Envio concluído: ${filename} para ${mainChat.id}; mensagem ${sentMessage?.key.id ?? 'ID indisponível'}.`
        );
    } catch (error) {
        console.error(
            `[Agendamento] Falha do Baileys ao enviar ${filename} para ${mainChat.id}.`,
            error
        );
    }
}

export function startDailyImageSchedule(sock: WASocket) {
    activeSocket = sock;
    console.log(
        `[Agendamento] Socket ativo: ${sock.user?.id ?? 'ID indisponível'}; grupo: ${clientState.mainChat()?.subject ?? 'não definido'} (${clientState.mainChat()?.id ?? 'sem JID'}).`
    );
    if (schedulesStarted) {
        console.log('[Agendamento] Cron jobs já estavam registrados; socket ativo atualizado.');
        return;
    }

    schedulesStarted = true;
    cron.schedule('0 12 * * *', () => {
        const weekday = saoPauloWeekday.format(new Date()).toLowerCase();
        const filename = weekdayImages[weekday];
        if (!filename) {
            console.error(`[Agendamento] Não há arquivo configurado para o dia: ${weekday}.`);
            return;
        }
        void sendImage(filename);
    }, { timezone: TIME_ZONE, name: 'weekday-image' });

    cron.schedule('0 22 * * *', () => {
        void sendImage('22h.jpeg');
    }, { timezone: TIME_ZONE, name: 'daily-image' });

    console.log(
        `[Agendamento] Cron jobs registrados: imagem do dia às 12:00 e 22h.jpeg às 22:10 (${TIME_ZONE}). Diretório: ${path.resolve('src/assets/diarias')}.`
    );
}

export function stopDailyImageSchedule(sock: WASocket) {
    if (activeSocket === sock) {
        activeSocket = undefined;
        console.warn(`[Agendamento] Socket ${sock.user?.id ?? 'sem ID'} desconectado; envios ficam suspensos até a reconexão.`);
    }
}