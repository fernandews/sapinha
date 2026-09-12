import { OptionImage } from "../@types/commandOption";

// Textos Enviados no WhatsApp
export const brincadeirasMenu = '🐸🌈 *MENU DE BRINCADEIRAS DA SAPINHA* ✨💕\n\n';

export const brincadeirasOptions: Record<string, OptionImage> = {
    'criminal': {
        titulo: 'Arquivo Criminal',
        imagem: './src/assets/brincadeiras/a-criminal.jpeg',},
    'ppp': {
        titulo: 'Penso, Pego, Passo',
        imagem: './src/assets/brincadeiras/ppp.jpeg',
    },
    'namoro': {
        titulo: 'Deu Namoro',
        imagem: './src/assets/brincadeiras/deu-namoro.jpeg',
    },
    'frente': {
        titulo: 'De Frente com Numasapa',
        imagem: './src/assets/brincadeiras/df-grupo.jpeg',
    },
    'tinder': {
        titulo: 'Tinder do Numasapa',
        imagem: './src/assets/brincadeiras/tinder.jpeg',
    },
    'tribunal': {
        titulo: 'Tribunal do Numasapa',
        imagem: './src/assets/brincadeiras/tribunal.jpeg',
    },
    'diamante': {
        titulo: 'Diamante da Temporada',
        imagem: './src/assets/brincadeiras/diamante.jpeg',
    },
};

export const brincadeirasMenuPS = '\n💡 *Dica:* Digite o nome da brincadeira (ex: !brincadeira namoro)';

export const opcaoInvalidaTexto = '❌ Opção inválida! Digite *!brincadeiras* para ver o menu.';

// Comando de brincadeiras (parte código)
export const brincadeirasCommandTriggers = ['!brincadeiras', '!brincadeira'];

export const brincadeirasCommand = {
    name: 'Brincadeiras',
    description: 'Envia as regras das brincadeiras',
    triggers: brincadeirasCommandTriggers,
}