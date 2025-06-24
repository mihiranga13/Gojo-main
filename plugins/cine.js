// plugins/cine.js – CineSubz Search & Download for Gojo Bot
const { cmd } = require('../lib/command');
const axios = require('axios');
const NodeCache = require('node-cache');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

cmd({
  pattern: 'cine',
  alias: ['cines', 'cinesubz'],
  react: '🎬',
  desc: 'Search & download movies from CineSubz',
  category: 'movie',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  const query = (q || '').trim();
  if (query.length < 2) {
    return conn.sendMessage(from, {
      text: '*🎬 CineSubz Search*\n\n_Usage:_ .cine <movie name>\n_Example:_ .cine Deadpool 2\n\n💡 Reply "done" to cancel'
    }, { quoted: mek });
  }

  try {
    const key = 'cine_' + query.toLowerCase();
    let results = cache.get(key);

    if (!results) {
      const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      if (!res.data?.status || !Array.isArray(res.data.results) || !res.data.results.length) {
        throw new Error(`No results for "${query}".`);
      }
      results = res.data.results;
      cache.set(key, results);
    }

    const movies = results.map((v, i) => ({
      n: i + 1,
      title: v.title,
      year: v.year,
      imdb: v.imdb,
      link: v.url || v.link,
      image: v.image
    }));

    let caption = '*🎬 Search Results*\n\n';
    for (const m of movies) {
      caption += `🎥 ${m.n}. *${m.title}* (${m.year || 'N/A'})\n⭐ IMDB: ${m.imdb || 'N/A'}\n\n`;
    }
    caption += '_Reply number • "done" to cancel_';

    const msgList = await conn.sendMessage(from, {
      image: { url: movies[0].image },
      caption: caption
    }, { quoted: mek });

    const waiting = new Map();

    const handler = async ({ messages }) => {
      const msg = messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;

      const body = msg.message.extendedTextMessage.text.trim();
      const replyTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (body.toLowerCase() === 'done') {
        conn.ev.off('messages.upsert', handler);
        waiting.clear();
        return conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
      }

      // Movie Selection
      if (replyTo === msgList.key.id) {
        const movie = movies.find(m => m.n === parseInt(body));
        if (!movie) {
          return conn.sendMessage(from, { text: '❌ Invalid selection.' }, { quoted: msg });
        }

        let details;
        try {
          const detailUrl = `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(movie.link)}`;
          details = (await axios.get(detailUrl, { timeout: 10000 })).data;
        } catch {
          return conn.sendMessage(from, { text: '❌ Failed to fetch details.' }, { quoted: msg });
        }

        if (!details?.status || !details.qualities?.length) {
          return conn.sendMessage(from, { text: '❌ No qualities available.' }, { quoted: msg });
        }

        const qualityList = details.qualities
          .filter(q => q.label.match(/480|720|1080/))
          .map((q, i) => ({
            n: i + 1,
            label: q.label,
            size: q.size,
            link: q.url || q.link
          }));

        if (!qualityList.length) {
          return conn.sendMessage(from, { text: '❌ No valid qualities.' }, { quoted: msg });
        }

        let qCaption = `*🎬 ${movie.title}*\n\n📥 Select Quality:\n\n`;
        for (const q of qualityList) {
          qCaption += `${q.n}. *${q.label}* (${q.size})\n`;
        }
        qCaption += '\n_Reply number • "done" to cancel_';

        const qualityMsg = await conn.sendMessage(from, {
          image: { url: movie.image },
          caption: qCaption
        }, { quoted: msg });

        waiting.set(qualityMsg.key.id, { movie, qualityList });
        return;
      }

      // Quality Selection
      if (waiting.has(replyTo)) {
        const { movie, qualityList } = waiting.get(replyTo);
        const choice = qualityList.find(q => q.n === parseInt(body));
        if (!choice) {
          return conn.sendMessage(from, { text: '❌ Invalid quality selection.' }, { quoted: msg });
        }

        let linkRes;
        try {
          const lUrl = `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(choice.link)}`;
          linkRes = (await axios.get(lUrl, { timeout: 10000 })).data;
        } catch {
          return conn.sendMessage(from, { text: '❌ Failed to get download link.' }, { quoted: msg });
        }

        const direct = linkRes?.direct_download || linkRes?.url;
        if (!direct) {
          return conn.sendMessage(from, { text: '❌ No direct link found.' }, { quoted: msg });
        }

        const size = choice.size || '';
        const gb = size.toLowerCase().includes('gb') ? parseFloat(size) : parseFloat(size) / 1024;
        if (gb > 2 || isNaN(gb)) {
          return conn.sendMessage(from, {
            text: `⚠️ File is large (~${gb.toFixed(2)} GB). Download here:\n${direct}`
          }, { quoted: msg });
        }

        const safeTitle = movie.title.replace(/[\\/:*?"<>|]/g, '');
        const fileName = `${BRAND} • ${safeTitle} • ${choice.label}.mp4`;

        try {
          await conn.sendMessage(from, {
            document: { url: direct },
            mimetype: 'video/mp4',
            fileName: fileName,
            caption: `🎬 *${movie.title}*\n📊 Size: ${choice.size}\n🔥 ${BRAND}`
          }, { quoted: msg });
          await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } catch {
          await conn.sendMessage(from, { text: `❌ Upload failed. Link:\n${direct}` }, { quoted: msg });
        }

        conn.ev.off('messages.upsert', handler);
      }
    };

    conn.ev.on('messages.upsert', handler);

  } catch (err) {
    console.error(err);
    conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
  }
});
