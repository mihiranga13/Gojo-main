const { fetchJson, getBuffer, sleep } = require('../lib/functions');
const { cmd } = require('../lib/command');
const conf = require('../settings');

cmd({
  pattern: 'cines',
  alias: ['ci'],
  react: '🎬',
  desc: 'Search and download movies from CineSubz',
  category: 'movie',
  filename: __filename,
}, async (conn, m, mek, { from, q, isME, reply }) => {
  if (!q) return reply('*🟡 Please provide a movie name to search!*');

  try {
    const res = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`);
    const list = res?.result?.data;
    if (!res?.status || !list?.length) return reply(`❌ No results found for: "${q}"`);

    let text = `🎬 *Search Results for:* "${q}"\n\n`;
    text += list.map((v, i) => `*${i + 1}.* ${v.title} (${v.year})`).join('\n');

    const msg = await conn.sendMessage(from, { text }, { quoted: mek });

    conn.addReplyTracker(msg.key.id, async (mek2, body) => {
      const pick = parseInt(body.trim());
      if (isNaN(pick) || pick < 1 || pick > list.length) return reply('❗ Invalid number. Try again.');

      const chosen = list[pick - 1];
      const details = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(chosen.link)}`);
      const movie = details?.result?.data;

      if (!movie?.dl_links?.length) return reply('❌ No download links available.');

      let qlist = `🎞️ *${movie.title}*\n\n📥 *Select a quality to download:*\n`;
      qlist += movie.dl_links.map((v, i) => `*${i + 1}.* ${v.quality} - ${v.size}`).join('\n');

      const msg2 = await conn.sendMessage(from, { text: qlist }, { quoted: mek2 });

      conn.addReplyTracker(msg2.key.id, async (mek3, body2) => {
        const pick2 = parseInt(body2.trim());
        if (isNaN(pick2) || pick2 < 1 || pick2 > movie.dl_links.length) return reply('❗ Invalid quality selection.');

        const chosenQuality = movie.dl_links[pick2 - 1];
        const direct = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(chosenQuality.link)}`);
        const finalUrl = direct?.result?.direct;

        if (!finalUrl) return reply('❌ Failed to retrieve the direct download link.');

        const thumb = await getBuffer(movie.image);
        await conn.sendMessage(from, { react: { text: '⬆️', key: msg2.key } });

        await conn.sendMessage(
          isME ? conf.MOVIE_JID || from : from,
          {
            document: { url: finalUrl },
            mimetype: 'video/mp4',
            fileName: `${movie.title} - ${chosenQuality.quality}.mp4`,
            caption: `🎬 *${movie.title}*\n⭐ *IMDb:* ${movie.imdbRate}\n📅 *Date:* ${movie.date}\n🌍 *Country:* ${movie.country}\n⏳ *Duration:* ${movie.duration}`,
            contextInfo: {
              externalAdReply: {
                title: movie.title,
                body: 'CineSubz X Queen Anju',
                mediaType: 1,
                thumbnail: thumb,
                renderLargerThumbnail: true,
                sourceUrl: chosen.link,
              },
            },
          },
          { quoted: mek3 }
        );

        await conn.sendMessage(from, { react: { text: '✅', key: msg2.key } });
      });
    });

  } catch (e) {
    console.error(e);
    reply('❌ *An error occurred while processing your request.*');
  }
});
