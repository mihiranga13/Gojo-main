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
    // Step 1: Search movies
    const searchRes = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`);
    console.log('Search API response:', searchRes);

    if (!searchRes?.status || !searchRes?.result?.data?.length)
      return reply(`❌ No results found for: "${q}"`);

    const list = searchRes.result.data;

    // Step 2: Show search results
    let text = `🎬 *Search Results for:* "${q}"\n\n`;
    text += list.map((v, i) => `*${i + 1}.* ${v.title} (${v.year})`).join('\n');

    const msg = await conn.sendMessage(from, { text }, { quoted: mek });

    // Step 3: Wait for user to pick a movie
    conn.addReplyTracker(msg.key.id, async (mek2, body) => {
      try {
        console.log('User selected movie:', body);

        const pick = parseInt(body.trim());
        if (isNaN(pick) || pick < 1 || pick > list.length) return reply('❗ Invalid movie number. Please try again.');

        const chosen = list[pick - 1];

        // Step 4: Fetch movie details and download links
        const movieRes = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(chosen.link)}`);
        console.log('Movie details API response:', movieRes);

        if (!movieRes?.status || !movieRes?.result?.data?.dl_links?.length)
          return reply('❌ No download links available for this movie.');

        const movie = movieRes.result.data;

        // Step 5: Show quality options
        let qlist = `🎞️ *${movie.title}*\n\n📥 *Select a quality to download:*\n`;
        qlist += movie.dl_links.map((v, i) => `*${i + 1}.* ${v.quality} - ${v.size}`).join('\n');

        const msg2 = await conn.sendMessage(from, { text: qlist }, { quoted: mek2 });

        // Step 6: Wait for quality selection
        conn.addReplyTracker(msg2.key.id, async (mek3, body2) => {
          try {
            console.log('User selected quality:', body2);

            const pick2 = parseInt(body2.trim());
            if (isNaN(pick2) || pick2 < 1 || pick2 > movie.dl_links.length) return reply('❗ Invalid quality selection. Please try again.');

            const chosenQuality = movie.dl_links[pick2 - 1];

            // Step 7: Fetch direct download link
            const directRes = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(chosenQuality.link)}`);
            console.log('Direct link API response:', directRes);

            if (!directRes?.result?.direct) return reply('❌ Failed to retrieve the direct download link.');

            const finalUrl = directRes.result.direct;
            const thumb = await getBuffer(movie.image);

            await conn.sendMessage(from, { react: { text: '⬆️', key: msg2.key } });

            // Step 8: Send the video document
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

          } catch (err) {
            console.error('Quality select error:', err);
            reply('❌ Error occurred while selecting quality.');
          }
        });
      } catch (err) {
        console.error('Movie select error:', err);
        reply('❌ Error occurred while selecting movie.');
      }
    });
  } catch (e) {
    console.error('Cines command error:', e);
    reply('❌ *An error occurred while processing your request.*');
  }
});
