import { OptionText } from "../@types/commandOption";

// Textos Enviados no WhatsApp
export const brincadeirasMenu = '🐸🌈 *MENU DE BRINCADEIRAS DA SAPINHA* ✨💕\n\n';

export const brincadeirasOptions: Record<string, OptionText> = {
    '1': {
        titulo: 'Verdade ou Desafio',
        texto: '🎲 *VERDADE OU DESAFIO*\n\n1. Escolha quem vai começar.\n2. Mande a pergunta ou o desafio aqui no grupo!\n\n[Insira seu texto personalizado aqui]'
    },
    '2': {
        titulo: 'Quem é mais provável',
        texto: '👀 *QUEM É MAIS PROVÁVEL*\n\nVote em quem do grupo tem mais cara de aprontar essa!\n\n[Insira seu texto personalizado aqui]'
    },
    '3': {
        titulo: 'O que você prefere',
        texto: '⚖️ *O QUE VOCÊ PREFERE*\n\nOpção A ou Opção B? Mandem as escolhas no chat!\n\n[Insira seu texto personalizado aqui]'
    }
};

export const brincadeirasMenuPS = '\n💡 *Dica:* Digite o número da brincadeira (ex: !brincadeira 1)';

export const opcaoInvalidaTexto = '❌ Opção inválida! Digite *!brincadeiras* para ver o menu.';

// Comando de brincadeiras (parte código)
export const brincadeirasCommandTriggers = ['!brincadeiras', '!brincadeira'];

export const brincadeirasCommand = {
    name: 'Brincadeiras',
    description: 'Envia as regras das brincadeiras',
    triggers: brincadeirasCommandTriggers,
}