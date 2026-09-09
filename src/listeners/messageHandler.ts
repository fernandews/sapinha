import { stateIA } from '../services/aiState';
import { gerarRespostaSapinha } from '../services/groq';
import { adicionarMensagemAoHistorico, obterHistoricoGrupo } from '../services/history';

export async function processarMensagem(message: any, groupId: string) {
    console.log(message.body);
    
    const texto = message.body?.trim().toLowerCase();
    const historicoContexto = obterHistoricoGrupo(groupId);

    // Trava: Se a IA estiver desativada, ignora o processamento pela Groq
    if (!stateIA.isAtiva()) {
        console.log('A IA está desativada. Ignorando processamento da mensagem.');
        await message.reply(`🐸 A Sapinha está dormindo no momento. Porque você não conversa com uma pessoa mesmo? ✨💖`);
        return;
    }

    const resposta = await gerarRespostaSapinha(texto, historicoContexto);
    adicionarMensagemAoHistorico(groupId, 'assistant', resposta);
    await message.reply(resposta);
}