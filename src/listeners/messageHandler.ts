import { Message, MessageMedia } from 'whatsapp-web.js';
import { stateIA } from '../services/aiState';
import { gerarRespostaSapinha, MidiaPart } from '../services/gemini';
import { adicionarMensagemAoHistorico, obterHistoricoGrupo } from '../services/history';

const TIPOS_MIDIA_SUPORTADOS = ['ptt', 'audio', 'image', 'sticker'];

/**
 * Função utilitária para converter mídias do whatsapp-web.js no formato MidiaPart do Gemini
 */
async function extrairMidia(message: Message): Promise<MidiaPart | null> {
    if (!message.hasMedia || !TIPOS_MIDIA_SUPORTADOS.includes(message.type)) {
        return null;
    }

    try {
        const media: MessageMedia = await message.downloadMedia();
        if (media && media.data) {
            return {
                inlineData: {
                    data: media.data,
                    mimeType: media.mimetype
                }
            };
        }
    } catch (error) {
        console.error('Erro ao baixar mídia da mensagem:', error);
    }
    return null;
}

async function salvarEResponder(texto: string, groupId: string, midias: MidiaPart[]) {
    // Registra a mensagem de texto no histórico (se houver texto)
    if (texto.trim()) {
        adicionarMensagemAoHistorico(groupId, 'user', texto);
    }

    const historicoContexto = obterHistoricoGrupo(groupId);

    // Chama o Gemini com texto, histórico e todas as mídias coletadas
    const resposta = await gerarRespostaSapinha(texto, historicoContexto, midias);

    // Salva a resposta da IA no histórico
    adicionarMensagemAoHistorico(groupId, 'assistant', resposta);

    return resposta;
}

export async function processarMensagem(message: Message, groupId: string) {
    // 1. Trava: Se a IA estiver desativada, ignora o processamento
    if (!stateIA.isAtiva()) {
        console.log('A IA está desativada. Ignorando processamento da mensagem.');
        await message.reply(`🐸 A Sapinha está dormindo no momento. Porque você não conversa com uma pessoa mesmo? ✨💖`);
        return;
    }

    try {
        console.log(`[MessageReceived] Tipo: ${message.type} | Grupo: ${groupId}`);

        const midiasColetadas: MidiaPart[] = [];
        let textoContextoQuoted = '';

        // 2. Processa a Mensagem Citada (Quoted Message), se houver
        if (message.hasQuotedMsg) {
            // Nota: whatsapp-web.js usa getQuotedMessage()
            const quotedMessage: Message = await message.getQuotedMessage();
            
            const midiaQuoted = await extrairMidia(quotedMessage);
            if (midiaQuoted) {
                midiasColetadas.push(midiaQuoted);
            } else if (quotedMessage.body && quotedMessage.body.trim()) {
                textoContextoQuoted = `[Mensagem respondida]: "${quotedMessage.body}"\n`;
            }
        }

        // 3. Processa a Mídia da Mensagem Atual, se houver
        const midiaAtual = await extrairMidia(message);
        if (midiaAtual) {
            midiasColetadas.push(midiaAtual);
        }

        // 4. Concatena os textos (legenda/mensagem + texto da citação se houver)
        const textoUsuario = message.body?.trim() || '';
        const textoFinalPrompt = `${textoContextoQuoted}${textoUsuario}`.trim();

        // 5. Se não houver nem texto e nem mídias válidas, interrompe o envio
        if (!textoFinalPrompt && midiasColetadas.length === 0) {
            return;
        }

        // 6. Envia tudo para o Gemini e responde no WhatsApp
        const resposta = await salvarEResponder(textoFinalPrompt, groupId, midiasColetadas);
        await message.reply(resposta);

    } catch (error) {
        console.error('Erro ao processar mensagem no Gemini:', error);
        await message.reply('🐸💔 Poxa, a sapinha teve um probleminha para pensar agora! ✨');
    }
}