const l = console.log
const config = require('../settings')
const { cmd, commands } = require('../lib/command')
const axios = require("axios");


cmd({
  pattern: "gdrive",
  desc: "Download Google Drive files.",
  react: "🌐",
  category: "download",
  filename: __filename
}, async (conn, m, store, { from, quoted, q, reply }) => {
  try {
    if (!q || !q.includes("drive.google.com")) {
      return reply("❌ Please provide a valid Google Drive link.");
    }

    await conn.sendMessage(from, { react: { text: "⬇️", key: m.key } });

    const apiUrl = `https://api.fgmods.xyz/api/downloader/gdrive?url=${encodeURIComponent(q)}&apikey=mnp3grlZ`;
    const response = await axios.get(apiUrl);
    const result = response.data?.result;

    if (!result || !result.downloadUrl) {
      return reply("⚠️ No download URL found. Please check the link and try again.");
    }

    await conn.sendMessage(from, {
      document: { url: result.downloadUrl },
      mimetype: result.mimetype || "application/octet-stream",
      fileName: result.fileName || "file-from-gdrive",
      caption: "> 🄿🄾🅆🄴🅁🄳 🅱🆈 𝔾𝕆𝕁𝕆_𝕄𝔻 😈"
    }, { quoted: m });

    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (error) {
    console.error("GDrive Download Error:", error);
    reply("❌ Error while fetching Google Drive file. Please try again.");
  }
});
