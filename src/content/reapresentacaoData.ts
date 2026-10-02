import { OptionImage } from "../@types/commandOption";

export const reapresentacao: OptionImage = {
        titulo: 'Reapresentação',
        imagem: './src/assets/reapresentacao.jpeg'
    };

export const reapresentacaoCommand = {
    name: 'Reapresentação',
    description: 'Envia o aviso de reapresentação',
    triggers: ['!reapresentacao, !reapresentação'],
}