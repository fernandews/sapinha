import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url'; 
import { Command } from '../@types/command';

export const loadCommands = async (): Promise<Map<string, Command>> => {
    const commands = new Map<string, Command>();
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) {
        console.warn('⚠️ Pasta de comandos não encontrada em:', commandsPath);
        return commands;
    }

    const commandFiles = fs
        .readdirSync(commandsPath)
        .filter((file) => file.endsWith('.ts') || file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        
        const fileUrl = pathToFileURL(filePath).href;
        const commandModule = await import(fileUrl);
        
        const command: Command = commandModule.default || commandModule;

        if (command && command.triggers) {
            command.triggers.forEach((trigger) => {
                commands.set(trigger.toLowerCase(), command);
            });
            console.log(`✅ Comando carregado: ${command.name} [${command.triggers.join(', ')}]`);
        }
    }

    return commands;
};