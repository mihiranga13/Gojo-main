// plugins/phub.js
const { cmd } = require('../lib/command');
const ytdlp = require('yt-dlp-exec').raw;
const fs = require('fs');
const https = require('https');
const path = require('path');
const os = require('os');

cmd({
  pattern: 'phub',
  alias: ['pornhub'],
  react: '🔞',
  desc: 'Download and send Pornhub video (.mp4)',
  category: 'downloader',
  use: '.phub <Pornhub-URL>',
  filename: __filename
}, async (m, text, { conn }) => {
  const url = (text || '').trim();
  if (!/pornhub\.com\/view_video\.php\?viewkey=/.test(url)) {
    return m.reply('🔞 *Please provide a valid Pornhub link!*\n\n📌 Usage: .phub https://www.pornhub.com/view_video.php?viewkey=...');
  }

  try {
    m.reply('🔍 Getting direct video link...');

    const proc = ytdlp('-g', url);
    let output = '';
    for await (const chunk of proc.stdout) output += chunk.toString();
    const links = output.trim().split('\n').filter(Boolean);
    const direct = links.pop();

    if (!direct.startsWith('http')) throw new Error('No valid video link.');

    const filename = path.join(os.tmpdir(), `phub_${Date.now()}.mp4`);

    m.reply('📥 Downloading and sending video...');

    const file = fs.createWriteStream(filename);
    https.get(direct, (res) => {
      res.pipe(file);
      file.on('finish', async () => {
        file.close();

        await conn.sendMessage(m.chat, {
          document: { url: filename },
          mimetype: 'video/mp4',
          fileName: `phub_${Date.now()}.mp4`,
        }, { quoted: m });

        fs.unlinkSync(filename); // cleanup
      });
    }).on('error', (err) => {
      fs.unlinkSync(filename);
      m.reply('❌ Download failed.');
    });

  } catch (err) {
    console.error(err);
    m.reply('❌ Could not download or send video.');
  }
});