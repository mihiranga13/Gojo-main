const { cmd } = require('../lib/command');
const { fetchJson, getBuffer } = require('../lib/functions');

const waiting = new Map();

cmd({
  pattern: 'cines',
  alias: ['ci'],
  react: '🎬',
  desc: 'Search and download movies from CineSubz',
  category: 'movie',
  filename: __filename,
}, async (conn, mek, m, { from, q, reply, isME }) => {
  if (!q) return reply('*🟡 Please provide a movie name to search!*');

  try {
    // Step 1: Search movies
    const searchRes = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`);

    if (!searchRes?.status || !searchRes?.result?.data?.length)
      return reply(`❌ No results found for: "${q}"`);

    const list = searchRes.result.data;

    // Step 2: Send search results
    let text = `🎬 *Search Results for:* "${q}"\n\n`;
    text += list.map((v, i) => `*${i + 1}.* ${v.title} (${v.year})`).join('\n');
    text += '\n\n🔢 Reply with the number of the movie you want to select.';

    const sentMsg = await conn.sendMessage(from, { text }, { quoted: mek });

    // Step 3: Register waiting state for user movie selection
    waiting.set(sentMsg.key.id, { step: 'select_movie', list, from });

  } catch (e) {
    console.error('Cines command error:', e);
    reply('❌ *An error occurred while processing your request.*');
  }
});

// Global message handler to process replies
async function onMessageUpsert(conn, m) {
  try {
    if (!m.message) return;
    const msgId = m.message.extendedTextMessage?.contextInfo?.stanzaId;
    const from = m.key.remoteJid;
    const body = m.message.conversation || m.message.extendedTextMessage?.text;
    if (!body || !msgId) return;

    if (!waiting.has(msgId)) return; // no waiting for this message

    const state = waiting.get(msgId);

    // Make sure the reply is from same chat
    if (state.from !== from) {
      waiting.delete(msgId);
      return;
    }

    if (state.step === 'select_movie') {
      const sel = parseInt(body.trim());
      if (isNaN(sel) || sel < 1 || sel > state.list.length) {
        await conn.sendMessage(from, { text: '❗ Invalid movie number. Please try again.' });
        return;
      }

      const chosen = state.list[sel - 1];

      // Fetch movie details and links
      const movieRes = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(chosen.link)}`);

      if (!movieRes?.status || !movieRes?.result?.data?.dl_links?.length) {
        await conn.sendMessage(from, { text: '❌ No download links available for this movie.' });
        waiting.delete(msgId);
        return;
      }

      const movie = movieRes.result.data;

      let qlist = `🎞️ *${movie.title}*\n\n📥 *Select a quality to download:*\n`;
      qlist += movie.dl_links.map((v, i) => `*${i + 1}.* ${v.quality} - ${v.size}`).join('\n');
      qlist += '\n\n🔢 Reply with the number of quality or "cancel" to stop.';

      const sentMsg2 = await conn.sendMessage(from, { text: qlist });

      waiting.set(sentMsg2.key.id, { step: 'select_quality', movie, from, parentId: msgId });
      waiting.delete(msgId);
    } else if (state.step === 'select_quality') {
      const text = body.trim().toLowerCase();
      if (text === 'cancel' || text === 'done') {
        await conn.sendMessage(from, { text: '✅ Process cancelled.' });
        waiting.delete(msgId);
        return;
      }

      const sel = parseInt(body.trim());
      if (isNaN(sel) || sel < 1 || sel > state.movie.dl_links.length) {
        await conn.sendMessage(from, { text: '❗ Invalid quality number. Please try again.' });
        return;
      }

      const chosenQuality = state.movie.dl_links[sel - 1];
      const directRes = await fetchJson(`https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(chosenQuality.link)}`);

      if (!directRes?.result?.direct) {
        await conn.sendMessage(from, { text: '❌ Failed to retrieve the direct download link.' });
        waiting.delete(msgId);
        return;
      }

      const finalUrl = directRes.result.direct;
      const thumb = await getBuffer(state.movie.image);

      await conn.sendMessage(from, { react: { text: '⬆️', key: m.key } });

      await conn.sendMessage(
        from,
        {
          document: { url: finalUrl },
          mimetype: 'video/mp4',
          fileName: `${state.movie.title} - ${chosenQuality.quality}.mp4`,
          caption: `🎬 *${state.movie.title}*\n⭐ *IMDb:* ${state.movie.imdbRate}\n📅 *Date:* ${state.movie.date}\n🌍 *Country:* ${state.movie.country}\n⏳ *Duration:* ${state.movie.duration}`,
          contextInfo: {
            externalAdReply: {
              title: state.movie.title,
              body: 'CineSubz X Queen Anju',
              mediaType: 1,
              thumbnail: thumb,
              renderLargerThumbnail: true,
              sourceUrl: state.movie.link || '',
            },
          },
        },
        { quoted: m }
      );

      await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
      waiting.delete(msgId);
    }
  } catch (e) {
    console.error('onMessageUpsert error:', e);
  }
}

// export the onMessageUpsert handler to your main bot file
module.exports = { onMessageUpsert };
