const { fetchJson } = require('../lib/functions');
const { cmd } = require('../lib/command');
const config = require('../settings');

// ✅ Synchronous default fallback baseUrl in case fetch fails
let baseUrl = 'https://apis.davidcyriltech.my.id'; // Default fallback URL

// ✅ Asynchronously update baseUrl from remote JSON
fetchJson('https://raw.githubusercontent.com/prabathLK/PUBLIC-URL-HOST-DB/main/public/url.json')
  .then(res => {
    if (res && res.api) baseUrl = res.api;
  })
  .catch(err => console.log('⚠️ Failed to fetch dynamic baseUrl. Using default.'));

const yourName = 'Gojo-MD ✻'; // ✅ Optional branding

cmd({
  pattern: "gdrive5",
  desc: "Download Google Drive files",
  category: "download",
  react: "⬇️",
  filename: __filename
},
async (conn, mek, m, {
  from, quoted, q, reply
}) => {
  try {
    if (!q || !q.startsWith("https://")) {
      return reply("❌ Please provide a valid Google Drive URL.");
    }

    await conn.sendMessage(from, { react: { text: "📥", key: mek.key } });
    reply("*Gojo-MD: Downloading your file...*");

    const res = await fetchJson(`${baseUrl}/api/gdrivedl?url=${q}`);

    if (!res || !res.data || !res.data.download) {
      return reply("❌ Failed to fetch download link. Make sure the link is public.");
    }

    await conn.sendMessage(from, {
      document: { url: res.data.download },
      fileName: res.data.fileName || "gdrive_file",
      mimetype: res.data.mimeType || "application/octet-stream",
      caption: `${res.data.fileName || 'File'}\n\n© ${yourName}`
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
