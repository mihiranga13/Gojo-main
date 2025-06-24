const { cmd } = require('../lib/command');
const { getAnti, setAnti } = require('../lib/antidel');

cmd({
    pattern: 'antidelete',
    alias: ['antidel', 'del'],
    desc: 'Toggle anti-delete feature',
    category: 'settings',
    filename: __filename
},
async (conn, mek, m, { reply, text, isCreator }) => {
    if (!isCreator) return reply('This command is only for the bot owner');

    try {
        const currentStatus = await getAnti();

        if (!text || text.toLowerCase() === 'status') {
            return reply(`*AntiDelete Status:* ${currentStatus ? '✅ ON' : '❌ OFF'}\n\nUsage:\n• .antidelete on\n• .antidelete off\n• .antidelete status`);
        }

        const action = text.toLowerCase().trim();

        if (action === 'on') {
            const success = await setAnti(true);
            if (success) return reply('✅ Anti-delete has been enabled');
            else return reply('❌ Failed to enable anti-delete');
        }

        if (action === 'off') {
            const success = await setAnti(false);
            if (success) return reply('❌ Anti-delete has been disabled');
            else return reply('❌ Failed to disable anti-delete');
        }

        return reply('Invalid command. Usage:\n• .antidelete on\n• .antidelete off\n• .antidelete status');
    } catch (error) {
        console.error('Error in antidelete command:', error);
        return reply('⚠️ An error occurred while processing your request.');
    }
});
