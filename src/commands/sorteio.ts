import { Command } from '../@types/command';
import { clientState } from '../services/clientState';

const sorteioCommandImplement: Command = {
    name: 'Sorteio',
    description: 'Sorteia um usuário do grupo',
    triggers: ['!sorteio', '!sortear', '!sorteia', '!sorteie'],

    async execute(msg, client, args) {
        const participants = clientState.mainChat()?.participants || [];
        const selectedParticipant = participants[Math.floor(Math.random() * participants.length)];
        const participantId = selectedParticipant.id;
        const participantNumber = (selectedParticipant.phoneNumber ?? participantId).split('@')[0];

        await sock.sendMessage(chatId, {
            caption: `🐸✨ Seja bem-vinda ao grupo, @${participantId.split('@')[0]}!`,
            mentions: [participantId]
        });
    }
};

export default sorteioCommandImplement;