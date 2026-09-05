export const removerNaoMarcou = '🐸💕 Oops! Parece que você não marcou ninguém para remover. Por favor, marque a pessoa ou responda à mensagem dela com *!ban*, tá bom? ✨';
export const removerSucesso = '🧹✨';
export const removerFalha = '❌ Vish! Verifique se eu tenho permissão de ADM no grupo... 💔';

export const removerCommandTriggers = ['!ban', '!remover'];
export const removerCommand = {
    name: 'Remover Membro',
    description: 'Remove um usuário do grupo (exclusivo para ADMs)',
    triggers: removerCommandTriggers,
    adminOnly: true
}
