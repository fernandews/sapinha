// Controle de estado em memória para ativar/desativar a IA
let iaAtiva = true;

export const stateIA = {
    isAtiva: () => iaAtiva,
    ativar: () => { iaAtiva = true; },
    desativar: () => { iaAtiva = false; },
};