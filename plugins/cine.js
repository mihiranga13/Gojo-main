const { cmd } = require('../lib/command');
const axios = require('axios');
const NodeCache = require('node-cache');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';
const cache = new NodeCache({ stdTTL: 300 });

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
      text: '*🎬 CineSubz Search*\n\n📌 Usage: .cine <movie name>\n🧪 Example: .cine Deadpool 2\n\n💡 Reply "done" to cancel'
    }, { quoted: mek });
  }

  try {
    const key = 'cine_' + query.toLowerCase();
    let results = cache.get(key);
    if (!results) {
      const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      if (!res.data?.status || !Array.isArray(res.data.results) || !res.data.results.length)
        throw new Error('No results found for "' + query + '".');
      results = res.data.results;
      cache.set(key, results);
    }

    const films = results.map((v, i) => ({
      n: i + 1,
      title: v.title,
      year: v.year,
      imdb: v.imdb,
      link: v.url || v.link,
      image: v.image
    }));

    let listCaption = '*🎬 SEARCH RESULTS*\n\n';
    for (const f of films)
      listCaption += `🎥 ${f.n}. *${f.title}* (${f.year || 'N/A'})\n⭐ IMDB: ${f.imdb || 'N/A'}\n\n`;
    listCaption += '🔢 Reply number • "done" to cancel';

    const listMsg = await conn.sendMessage(from, {
      image: { url: films[0].image },
      caption: listCaption
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

      if (replyTo === listMsg.key.id) {
        const film = films.find(f => f.n === parseInt(body));
        if (!film)
          return conn.sendMessage(from, { text: '❌ Invalid number.' }, { quoted: msg });

        let mov;
        try {
          const mUrl = `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(film.link)}`;
          mov = (await axios.get(mUrl, { timeout: 10000 })).data;
        } catch {
          return conn.sendMessage(from, { text: '❌ Failed to fetch details.' }, { quoted: msg });
        }

        if (!mov?.status || !mov.qualities?.length)
          return conn.sendMessage(from, { text: '❌ No qualities found.' }, { quoted: msg });

        const qualities = mov.qualities
          .filter(q => q.label.match(/480|720|1080/))
          .map((q, i) => ({ n: i + 1, label: q.label, size: q.size, link: q.url || q.link }));

        if (!qualities.length)
          return conn.sendMessage(from, { text: '❌ No valid qualities.' }, { quoted: msg });

        let qCap = `*🎬 ${film.title}*\n\n📥 Choose quality:\n\n`;
        for (const ql of qualities)
          qCap += `${ql.n}. *${ql.label}* (${ql.size})\n`;
        qCap += '\n🔢 Reply number • "done" to cancel';

        const qMsg = await conn.sendMessage(from, {
          image: { url: film.image },
          caption: qCap
        }, { quoted: msg });

        waiting.set(qMsg.key.id, { film, qualities });
        return;
      }

      if (waiting.has(replyTo)) {
        const { film, qualities } = waiting.get(replyTo);
        const pick = qualities.find(p => p.n === parseInt(body));
        if (!pick)
          return conn.sendMessage(from, { text: '❌ Wrong quality.' }, { quoted: msg });

        let linkRes;
        try {
          const lUrl = `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(pick.link)}`;
          linkRes = (await axios.get(lUrl, { timeout: 10000 })).data;
        } catch {
          return conn.sendMessage(from, { text: '❌ Failed to resolve link.' }, { quoted: msg });
        }

        const direct = linkRes?.direct_download || linkRes?.url;
        if (!direct)
          return conn.sendMessage(from, { text: '❌ Direct link not found.' }, { quoted: msg });

        const sz = (pick.size || '').toLowerCase();
        const gb = sz.includes('gb') ? parseFloat(sz) : parseFloat(sz) / 1024;
        if (gb > 2 || isNaN(gb)) {
          return conn.sendMessage(from, {
            text: `⚠️ File too large (> ${gb.toFixed(2)} GB). Link:\n${direct}`
          }, { quoted: msg });
        }

        const safe = film.title.replace(/[\\/:*?"<>|]/g, '');
        const fname = `${BRAND} • ${safe} • ${pick.label}.mp4`;

        try {
          await conn.sendMessage(from, {
            document: { url: direct },
            mimetype: 'video/mp4',
            fileName: fname,
            caption: `🎬 *${film.title}*\n📊 Size: ${pick.size}\n🔥 ${BRAND}`
          }, { quoted: msg });
          await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } catch {
          await conn.sendMessage(from, { text: `❌ Upload failed. Link:\n${direct}` }, { quoted: msg });
        }
      }
    };

    conn.ev.on('messages.upsert', handler);
  } catch (err) {
    console.error(err);
    conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
  }
});
