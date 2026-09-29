import { WASocket, WAMessage } from '@whiskeysockets/baileys';
import { SapinhaMessage } from './whatsapp';

export interface Command {
    name: string;
    description: string;
    triggers: string[];
    adminOnly?: boolean;
    execute: (
        msg: SapinhaMessage,
        client: WASocket,
        args: string[],
        commandsMap?: Map<string, Command>
    ) => Promise<void | WAMessage>;
}