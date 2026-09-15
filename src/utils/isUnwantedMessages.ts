export const isUnwantedMessage = (msg: any): boolean => {
    const isGroup = msg.from.endsWith('@g.us');

    return !isGroup;
};