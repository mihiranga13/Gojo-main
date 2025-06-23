const config = require('../settings');
const { cmd } = require('../lib/command');
const { fetchJson } = require('../lib/functions');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const searchUrl = config.CINE_API_URL || 'https://my-api-amber-five.vercel.app/api/cine';
const infoUrl = 'https://cinesub-info.vercel.app/?apikey=' + encodeURIComponent(config.CINE_API_KEY || 'dinithimegana');

//---------------------- .cine ------------------------//
cmd({
  pattern: 'cine',
  alias: ['cinesubz'],
  react: '🔎',
  category: 'movie',
  desc: 'Movie downloader with Sinhala subtitles',
  filename: __filename,
}, async (conn, m, mek, { from, q, prefix, reply }) => {
  try {
    if (!q) return reply('*🔍 කරුණාකර සෙවීමට චිත්‍රපට නාමයක් ලබා දෙන්න!*');

    const res = await fetchJson(`${searchUrl}?q=${encodeURIComponent(q)}`).catch(e => ({}));
    const movies = Array.isArray(res?.data) ? res.data : res;

    if (!movies || !movies.length) return reply('*🚫 කිසිඳු ප්‍රතිඵලයක් හමු නොවීය!*');

    global._cineCache = global._cineCache || {};
    global._cineCache[from] = movies;

    const rows = movies.map((v, i) => ({
      title: `${v.title || 'Unknown'} (${v.year || 'N/A'})`,
      rowId: `${prefix}cinedl ${v.url || v.link || v.slug || ''}`,
    }));

    return conn.sendMessage(from, {
      text: `*🎬 CINESUBZ ප්‍රතිඵලය:*\n_“${q}” සදහා මෙන්න ප්‍රතිඵල._`,
      footer: '🪄 Powered by Hiran-MD',
      buttonText: 'Reply Below Number 🔢',
      sections: [{ title: '🎥 Available Movies', rows }],
    }, { quoted: mek });

  } catch (e) {
    console.log(e);
    await reply('*❌ දෝෂයක් ඇතිවුණා!*');
  }
});

//---------------------- .cinedl ------------------------//
cmd({
  pattern: 'cinedl',
  dontAddCommandList: true,
  react: '🎥',
  desc: 'Movie downloader',
  filename: __filename,
}, async (conn, m, mek, { from, q, prefix, reply }) => {
  try {
    if (!q.includes('±')) {
      // Step 1: Get movie info
      if (!q) return reply('*🔗 URL එකක් දෙන්න!*');
      const res = await fetchJson(`${infoUrl}&url=${encodeURIComponent(q)}`).catch(() => null);
      const data = res?.data || res;
      if (!data) return reply('🚩 *මූලික තොරතුරු ලබාගැනීමේදී දෝෂයකි!*');

      const links = data.dl_links || [];
      if (!links.length) return reply('⚠️ *Download Links නැහැ!*');

      const caption =
        `*🎬 නාමය:* ${data.title}\n` +
        `*📅 නිකුත් වු දිනය:* ${data.date}\n` +
        `*⭐ IMDB:* ${data.imdb}\n` +
        `*⏱️ කලයුත්ත:* ${data.runtime}\n` +
        `*🌍 රට:* ${data.country}\n` +
        `*👤 උපසිරැසි:* ${data.subtitle_author}`;

      const rows = links.map(l => ({
        title: `${l.quality} (${l.size})`,
        rowId: `${prefix}cinedl ${data.image}±${l.link}±${data.title}±${l.quality}`,
      }));

      return conn.sendMessage(from, {
        image: { url: data.image },
        caption: caption,
        footer: '> © Powered by Hiran-MD 🔒',
        buttonText: 'Reply Below Number 🔢',
        sections: [{ title: '📥 Available Qualities', rows }],
      }, { quoted: mek });

    } else {
      // Step 2: Auto Download (NO LIMIT)
      const [image, link, title, quality] = q.split('±');
      if (!link || !title) return reply('❌ *Invalid selection!*');

      await reply(`📥 *Downloading:* ${title} (${quality})\n⏳ Please wait...`);

      const fileName = `${title}_${quality}_${Date.now()}.mp4`;
      const filePath = path.join(__dirname, '../temp', fileName);
      const writer = fs.createWriteStream(filePath);

      const res = await axios({
        url: link,
        method: 'GET',
        responseType: 'stream',
      });

      res.data.pipe(writer);

      writer.on('finish', async () => {
        const media = fs.readFileSync(filePath);
        await conn.sendMessage(from, {
          document: media,
          mimetype: 'video/mp4',
          fileName: `${title} (${quality}).mp4`
        }, { quoted: mek });

        fs.unlinkSync(filePath); // clean temp
      });

      writer.on('error', async () => {
        reply('❌ *Failed to download the video file.*');
      });
    }
  } catch (e) {
    console.log(e);
    await reply('🚫 *Error while processing your request.*');
  }
});
