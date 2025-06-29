const { cmd } = require('../lib/command');
const axios = require('axios');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';

cmd({
  pattern: "gdrive",
  desc: "Download Google Drive file via direct link",
  react: "📁",
  category: "media",
  filename: __filename,
}, async (conn, mek, m, { from, args, reply }) => {
  try {
    const gdriveUrl = args.join(" ").trim();
    if (!gdriveUrl.includes("drive.google.com")) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
      return reply("*❌ Provide a valid Google Drive link!*\nExample: `.gdrive https://drive.google.com/file/d/XYZ/view`");
    }

    await conn.sendMessage(from, { react: { text: "⏬", key: mek.key } });

    const api = `https://apis.davidcyriltech.my.id/gdrive?url=${encodeURIComponent(gdriveUrl)}`;
    const res = await axios.get(api);

    if (!res.data || !res.data.downloadUrl) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
      return reply("❌ Failed to get the direct download link.");
    }

    const { fileName, downloadUrl, size } = res.data;

    const sizeMB = parseFloat(size) / 1024 / 1024;
    if (sizeMB > 2048) {
      return reply(`⚠️ File too large for direct upload.\n📎 *Download Link:* ${downloadUrl}`);
    }

    await conn.sendMessage(from, {
      document: { url: downloadUrl },
      mimetype: "application/octet-stream",
      fileName,
      caption: `📁 *File Name:* ${fileName}\n📦 *Size:* ${size}\n\n🔥 ${BRAND}`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key }});
  } catch (e) {
    console.error("GDrive error:", e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
    reply("❌ ERROR: Could not process Google Drive link.");
  }
});
