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
        const chatId = clientState.mainChat()?.id;

        await client.sendMessage(chatId || "", {
            text: `@${participantId.split('@')[0]}`,
            mentions: [participantId]
        }, 
        {quoted: msg.original});
    }
};

export default sorteioCommandImplement;