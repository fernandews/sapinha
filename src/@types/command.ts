import { Client, Message } from 'whatsapp-web.js';

export interface Command {
    name: string;
    description: string;
    triggers: string[];
    execute: (msg: Message, client: Client, args: string[]) => Promise<void | Message>;
}