const { cmd } = require('../lib/command');
const fetch = require('node-fetch');        // Node ≥ 18 නම් global fetch උපයෝග කල හැක
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');                 // ➜  npm i tmp
const { pipeline } = require('stream/promises');

cmd(
{
  pattern: 'gdrive',
  alias: ['gdl', 'gdriveDl'],
  react: '🗂️',
  desc : 'Download Google Drive files and upload directly (<= 2 GB)',
  category: 'download',
  filename: __filename
},
async (conn, mek, m, { from, reply, q, sender }) => {
  try {
    /* ───────────────────────────── Validate URL ───────────────────────────── */
    if (!q) {
      return reply('❌  *Google Drive URL එක දෙන්න!*\nඋදාහරණය :  `.gdrive https://drive.google.com/file/d/FILE_ID/view`');
    }

    // Accept both file/d and uc?id formats
    const reg = /drive\.google\.com\/(?:file\/d\/|uc\?id=)([A-Za-z0-9_-]{10,})/;
    const match = q.match(reg);
    if (!match) return reply('❌  *ලබා දුන්න URL එක Google Drive එකක් නෙමෙයි*');

    /* ───────────────────────── Fetch direct-link & meta ───────────────────── */
    const apiUrl = `https://apis.davidcyriltech.my.id/gdrive?url=${encodeURIComponent(q)}`;
    const { data } = await axios.get(apiUrl, { timeout: 30_000 });

    if (data.status !== 200 || !data.success)
      return reply('⚠️  Google Drive file එක අරගෙන බෑ.');

    const {
      name = 'file',
      mimetype = 'application/octet-stream',
      size = 0,                              // bytes
      download_link: dl
    } = data;

    if (!dl) return reply('⚠️  Direct download link එක හමු නොවීය.');

    /* ─────────────────────── Check WhatsApp size limit ────────────────────── */
    const MAX_DOC = 2 * 1024 * 1024 * 1024;  // 2 GB docs limit on WhatsApp Web 0
    if (size > MAX_DOC) {
      return reply(`📄 *${name}* නම් ෆයිලය ${(size/1_048_576).toFixed(1)} MB.
      WhatsApp docs limit (2 GB) ඉක්මවා තියෙන නිසා file එකට direct link එක එන්නෙ මෙන්න: \n${dl}`);
    }

    /* ───────────────────────── Download to temp file ──────────────────────── */
    const tmpFile = tmp.fileSync({ prefix: 'gdrive-', postfix: path.extname(name) });
    await pipeline(
      (await axios.get(dl, { responseType: 'stream' })).data,
      fs.createWriteStream(tmpFile.name)
    );

    /* ─────────────────────────── Send the document ────────────────────────── */
    await conn.sendMessage(
      from,
      {
        document : fs.readFileSync(tmpFile.name),   // Baileys will stream-upload
        mimetype,
        fileName : name
      },
      { quoted: mek }
    );

    tmpFile.removeCallback();   // cleanup
  } catch (err) {
    console.error(err);
    reply('⚠️  File එක download / upload කරන්න ගියේදී error එකක් ආවා.');
  }
});
