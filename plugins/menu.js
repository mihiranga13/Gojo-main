const config = require('../settings');
const { cmd } = require('../lib/command');
const { runtime } = require('../lib/functions');

cmd({
  pattern: "menu",
  react: "📜",
  alias: ["panel", "help"],
  desc: "Displays the main command menu",
  category: "main",
  filename: __filename
}, async (robin, m, mek, { from, prefix, reply, pushName }) => {

  const menuText = `
╭───────────────◆
│  Hello, *${pushName}*!
│  🤖 *GOJO MD MENU*
╰───────────────◆

🧩 *Owner Commands*
├› ${prefix}mode [public/private]
├› ${prefix}block @user
├› ${prefix}unblock @user
├› ${prefix}ban / unban

🛠️ *Download Commands*
├› ${prefix}video [yt link]
├› ${prefix}yta [yt link]
├› ${prefix}slanimeclub [anime name]
├› ${prefix}film [movie name]

🧠 *Utility Commands*
├› ${prefix}ping
├› ${prefix}runtime
├› ${prefix}script
├› ${prefix}alive

🖼️ *Group Management*
├› ${prefix}kick @user
├› ${prefix}add +94xxxxxxxxx
├› ${prefix}promote @user
├› ${prefix}demote @user
├› ${prefix}gname [name]
├› ${prefix}gpp [img]

🎨 *Converter*
├› ${prefix}sticker
├› ${prefix}photo
├› ${prefix}mp3
├› ${prefix}mp4

🔐 *Database Tools*
├› ${prefix}getcase
├› ${prefix}savecase
├› ${prefix}delcase

╭───────────────◆
│ _🕒 Uptime:_ ${runtime(process.uptime())}
╰───────────────◆
  `.trim();

  const buttons = [
    { buttonId: `${prefix}owner`, buttonText: { displayText: '👤 Owner' }, type: 1 },
    { buttonId: `${prefix}script`, buttonText: { displayText: '💻 Script' }, type: 1 },
    { buttonId: `${prefix}ping`, buttonText: { displayText: '📶 Ping' }, type: 1 }
  ];

  const buttonMessage = {
    text: menuText,
    footer: `⚡ GOJO-MD BOT | Powered by @GOJO`,
    buttons: buttons,
    headerType: 1
  };

  await robin.sendMessage(from, buttonMessage, { quoted: mek });
});
