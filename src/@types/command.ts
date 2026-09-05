import { Client, Message } from 'whatsapp-web.js';

export interface Command {
    name: string;
    description: string;
    triggers: string[];
    adminOnly?: boolean;
    execute: (
        msg: Message,
        client: Client,
        args: string[],
        commandsMap?: Map<string, Command>
    ) => Promise<void | Message>;
}