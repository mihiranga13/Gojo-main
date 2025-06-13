
const config = require('../settings');
const { cmd } = require('../lib/command');
const { runtime } = require('../lib/functions');
const os = require('os');

// Logo / banner image URL
const imageUrl = 'https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png';

/*
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  .menu  â€“  Main menu command for GOJO-MD WhatsApp bot
  â€¢ Sends a banner image + caption with dynamic details
  â€¢ Shows three quick-reply buttons (Owner, Ping, Film)
  â€¢ Easy to extend: just add items to buttons[] & menuText
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€*/

cmd({
  pattern: 'menu',
  alias: ['panel', 'help', 'commands'],
  react: 'ðŸ“œ',
  category: 'main',
  desc: 'Displays the main menu',
  filename: __filename,
}, async (conn, m, mek, { from, prefix, pushName }) => {
  try {
    // Build the caption text
    const caption = \`â•­â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â—†\n\` +
                    \`â”‚ *ðŸ¤– \${config.BOT_NAME} MENU*\n\` +
                    \`â•°â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â—†\n\` +
                    \`ðŸ‘¤ *User:* \${pushName}\n\` +
                    \`ðŸ‘‘ *Owner:* \${config.OWNER_NAME}\n\` +
                    \`â±ï¸ *Uptime:* \${runtime(process.uptime())}\n\` +
                    \`ðŸ“Ÿ *Prefix:* \${prefix}\n\` +
                    \`â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€\n\` +
                    \`*ðŸ§¾ Quick Commands:*\n\` +
                    \`  â€¢ \${prefix}film â€“ Movie search\n\` +
                    \`  â€¢ \${prefix}slanimeclub â€“ Anime DL\n\` +
                    \`  â€¢ \${prefix}ytv â€“ YouTube video\n\` +
                    \`  â€¢ \${prefix}video â€“ YouTube search\n\` +
                    \`  â€¢ \${prefix}owner â€“ Contact owner\n\` +
                    \`  â€¢ \${prefix}ping â€“ Speed test\n\n\` +
                    \`Â© \${config.BOT_NAME} by \${config.OWNER_NAME}\`;

    // Compose the button message
    const message = {
      image: { url: imageUrl },
      caption,
      footer: 'ðŸ¤– Powered by GOJO-MD',
      buttons: [
        { buttonId: \`\${prefix}owner\`, buttonText: { displayText: 'ðŸ‘‘ Owner' }, type: 1 },
        { buttonId: \`\${prefix}ping\`, buttonText: { displayText: 'ðŸ“¡ Ping' }, type: 1 },
        { buttonId: \`\${prefix}film\`, buttonText: { displayText: 'ðŸŽ¬ Film' }, type: 1 },
      ],
      headerType: 4,
      contextInfo: { mentionedJid: [config.OWNER_NUMBER] },
    };

    await conn.sendMessage(from, message, { quoted: m });
  } catch (err) {
    console.error('âŒ Error in .menu command:', err);
    await conn.sendMessage(from, { text: 'âŒ Error displaying menu.' }, { quoted: m });
  }
});
