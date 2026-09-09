import { OptionText } from "../@types/commandOption";

// Textos Enviados no WhatsApp
export const iaMenu = '🐸🌈 *DESLIGAR/LIGAR SAPINHA* ✨💕\n\n';

export const iaOptions: Record<string, OptionText> = {
    'on': {
        titulo: 'Ligar Sapinha',
        texto: '✅ *SAPINHA LIGADA*\n\nA Sapinha está agora ativa e pronta para ajudar!'
    },
    'off': {
        titulo: 'Desligar Sapinha',
        texto: '❌ *SAPINHA DESLIGADA*\n\nA Sapinha está desativada e responderá apenas a comandos.'
    },
    'status': {
        titulo: 'Status da Sapinha',
        texto: '👾 *Status da Sapinha*\n\nA Sapinha está: [STATUS]\n\n'
    },
};

export const opcaoInvalidaTexto = '❌ Opção inválida! Digite *!sapinha* para ver o menu.';
