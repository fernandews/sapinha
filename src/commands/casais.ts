import { Command } from '../@types/command';
import { casais, regraCasais } from '../content/casaisData';

const casaisCommand: Command = {
    name: 'Casais',
    description: 'Mostra a lista atualizada de casais do grupo',
    triggers: ['!casais', '!casal'],

    async execute(msg) {
        const lista = casais
            .map((casal, index) => {
                const parceiro = casal.segundaPessoaNoGrupo
                    ? casal.segundaPessoa
                    : 'não está no grupo';

                return `${index + 1}. ${casal.primeiraPessoa} & ${parceiro}`;
            })
            .join('\n');

        await msg.reply(
            `📝 *LISTA DE CASAIS ATUALIZADA!*\n\n` +
            `*Regra do dia:* ${regraCasais}\n` +
            `🩷❤️🧡💛💚🩵💜\n\n${lista}`
        );
    },
};

export default casaisCommand;
