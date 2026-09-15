export const isUnwantedMessage = (msg: any): boolean => {
    console.log(msg)
    const isGroup = msg.from.endsWith('@g.us');

    return !isGroup;
};