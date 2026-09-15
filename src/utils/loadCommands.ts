import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'; 
import { Command } from '../@types/command';

export const loadCommands = async (): Promise<Map<string, Command>> => {
    console.log('📂 Iniciando carregamento de comandos...');
    
    const commands = new Map<string, Command>();
    const commandsPath = path.resolve(__dirname, '../commands');

    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️ Pasta de comandos não encontrada em:', commandsPath);
        return commands;
    }

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => 
            (file.endsWith('.ts') || file.endsWith('.js')) && 
            !file.endsWith('.d.ts') && 
            !file.endsWith('.js.map')
        );

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const fileUrl = pathToFileURL(filePath).href;

        try {
            const commandModule = await import(fileUrl);

            // Desempacota as camadas de 'default' geradas pelo export default do TypeScript
            let command: Command = commandModule.default;
            if (command && (command as any).default) {
                command = (command as any).default;
            }

            // Validação da interface do comando
            if (command && Array.isArray(command.triggers)) {
                command.triggers.forEach((trigger) => {
                    commands.set(trigger.toLowerCase(), command);
                });
                console.log(`✅ Comando carregado: ${command.name || file} [${command.triggers.join(', ')}]`);
            } else {
                console.warn(`⚠️ Estrutura 'triggers' não encontrada no arquivo: ${file}`);
                console.log('   Objeto recebido:', command);
            }
        } catch (error) {
            console.error(`❌ Erro ao importar o comando ${file}:`, error);
        }
    }

    console.log(`🚀 Carregamento concluído. Total de gatilhos no Map: ${commands.size}`);
    
    return commands;
};