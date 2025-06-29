const { cmd } = require('../lib/command');
const { fetchJson } = require('../lib/functions');
const baseUrl = 'https://apis.davidcyriltech.my.id'; // ✅ Base URL fixed
const yourName = 'Gojo-MD'; // ✅ Define your brand or sender name here

cmd({
  pattern: "gdrive",
  alias: ["googledrive"],
  desc: "Download files from Google Drive",
  category: "download",
  react: "📩",
  filename: __filename
}, async (conn, mek, m, {
  from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2,
  botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants,
  groupAdmins, isBotAdmins, isAdmins, reply
}) => {
  try {
    if (!q || !q.startsWith("https://")) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
      return reply("❌ Please provide a valid Google Drive link.");
    }

    await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
    reply("*GOJO MD - Fetching your Google Drive file...*");

    const res = await fetchJson(`${baseUrl}/api/gdrivedl?url=${encodeURIComponent(q)}`);

    if (!res || !res.data || !res.data.download) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
      return reply("❌ Failed to fetch file from Google Drive. Please check the URL.");
    }

    const { download, fileName, mimeType } = res.data;

    await conn.sendMessage(from, {
      document: { url: download },
      fileName: fileName || "gdrive_file",
      mimetype: mimeType || "application/octet-stream",
      caption: `✅ *${fileName || 'File'} downloaded successfully!*\n\n🌐 *Powered by* ${yourName}`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
  } catch (e) {
    console.error("GDrive Download Error:", e);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
    reply(`❌ An error occurred while downloading the file:\n${e.message}`);
  }
});
