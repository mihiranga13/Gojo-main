const { cmd } = require("../lib/command");
const config = require("../settings");
const fs = require("fs");

cmd({
  pattern: "menu",
  alias: ["help", "commands"],
  category: "main",
  desc: "The Ultimate Supirima Menu 🧠💠",
  filename: __filename,
}, async (conn, m, mdata, { pushName, prefix, isOwner, reply }) => {
  const date = new Date().toLocaleDateString("en-US");
  const time = new Date().toLocaleTimeString("en-US");

  const msg = `
╭━━〔 👋 *Hello ${pushName}!* 〕━━━╮
┃
┃ 📅 Date: ${date}
┃ ⏰ Time: ${time}
┃ 🧠 Status: *Online & Smart!*
┃
┃ 💠 *SUPIRIMA MENU CATEGORIES*
┃
┃ 🔍 Search Tools
┃   ┗ ${prefix}ytsearch, ${prefix}film, ${prefix}anime
┃ 📥 Downloaders
┃   ┗ ${prefix}ytv, ${prefix}yta, ${prefix}igdl, ${prefix}tiktok
┃ 🧩 AI / Chat
┃   ┗ ${prefix}ai, ${prefix}gpt, ${prefix}bard
┃ 🛠️ System
┃   ┗ ${prefix}ping, ${prefix}runtime, ${prefix}uptime
┃ 🎮 Fun / Tools
┃   ┗ ${prefix}joke, ${prefix}quote, ${prefix}tts, ${prefix}photo
┃ 👑 Owner Only
┃   ┗ ${prefix}block, ${prefix}eval, ${prefix}update
┃
╰━━━━━━━━━━━━━━━━━━━━━━╯

🔘 _Type_ *${prefix}help command* _for specific command usage._
🔗 GitHub: github.com/GOJO1999/GOJO-main
`;

  const thumbnail = fs.readFileSync("./media/gojo-menu.jpg"); // replace with your image path

  await conn.sendMessage(m.chat, {
    image: thumbnail,
    caption: msg,
    contextInfo: {
      externalAdReply: {
        title: "🔥 Supirima GOJO Menu System",
        body: "Smart. Fast. Beautiful.",
        thumbnail,
        mediaType: 1,
        renderLargerThumbnail: true,
        showAdAttribution: true,
        
      }
    }
  }, { quoted: m });
});
