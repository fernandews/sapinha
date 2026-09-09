export const isUnwantedMessage = (msg: any): boolean => {
    const body = msg.body?.trim();
    const isGroup = msg.from.endsWith('@g.us');

    return !body || !isGroup;
};