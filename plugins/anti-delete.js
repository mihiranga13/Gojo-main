const { cmd } = require('../lib/command');
const { getAnti, setAnti } = require('../lib/antidel');

cmd({
    pattern: "antidelete",
    alias: ['antidel', 'del'],
    desc: "Toggle anti-delete feature",
    category: "settings",
    filename: __filename
},
async (conn, mek, m, { from, reply, text, isCreator }) => {

    if (!isCreator) return reply('This command is only for the bot owner');
    
    const currentStatus = await getAnti();
    
    if (!text || text.toLowerCase() === 'status') {
        return reply(`*AntiDelete Status:* ${currentStatus ? '✅ ON' : '❌ OFF'}\n\nUsage:\n• .antidelete on\n• .antidelete off\n• .antidelete status`);
    }
    
    const action = text.toLowerCase().trim();
    
    if (action === 'on') {
        await setAnti(true);
        return reply('✅ Anti-delete has been enabled');
    } 
    else if (action === 'off') {
        await setAnti(false);
        return reply('❌ Anti-delete has been disabled');
    } 
    else {
        return reply('Invalid command. Usage:\n• .antidelete on\n• .antidelete off\n• .antidelete status');
    }
});
