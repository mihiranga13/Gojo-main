const { cmd } = require('../lib/command');
const axios = require('axios');
const NodeCache = require('node-cache');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

cmd({
  pattern: 'ciyne',
  alias: ['cines', 'cinesubz'],
  react: '🎬',
  desc: 'Search & download movies from CineSubz',
  category: 'movie',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {
  if (!q) return conn.sendMessage(from, {
    text: '*🎬 CineSubz Search*\n\n📌 Usage: .cine <name>\n🧪 Example: .cine Joker\n\n🔁 Reply "done" to cancel',
  }, { quoted: mek });

  try {
    const key = 'cine_' + q.toLowerCase();
    let results = cache.get(key);
    if (!results) {
      const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`);
      if (!res.data?.status || !res.data.results?.length) throw new Error('No results found.');
      results = res.data.results;
      cache.set(key, results);
    }

    const list = results.map((v, i) => ({
      n: i + 1,
      title: v.title,
      year: v.year,
      imdb: v.imdb,
      link: v.url,
      image: v.image
    }));

    let txt = '*🎬 SEARCH RESULTS*\n\n';
    for (const f of list)
      txt += `🎥 ${f.n}. *${f.title}* (${f.year})\n⭐ IMDB: ${f.imdb}\n\n`;
    txt += '🔢 Reply number • "done" to cancel';

    const listMsg = await conn.sendMessage(from, {
      image: { url: list[0].image },
      caption: txt
    }, { quoted: mek });

    const waiting = new Map();

    const handler = async ({ messages }) => {
      const msg = messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;
      const body = msg.message.extendedTextMessage.text.trim();
      const replyTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;

      if (body.toLowerCase() === 'done') {
        conn.ev.off('messages.upsert', handler);
        return conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
      }

      // Step 1: Select film
      if (replyTo === listMsg.key.id) {
        const film = list.find(f => f.n === parseInt(body));
        if (!film) return conn.sendMessage(from, { text: '❌ Invalid number.' }, { quoted: msg });

        const mres = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(film.link)}`);
        const mov = mres.data;
        if (!mov?.status || !mov.qualities?.length) return conn.sendMessage(from, { text: '❌ No qualities.' }, { quoted: msg });

        const qualities = mov.qualities.map((v, i) => ({
          n: i + 1,
          label: v.label,
          size: v.size,
          link: v.url
        }));

        let qText = `*🎬 ${film.title}*\n\n📥 Choose quality:\n\n`;
        for (const q of qualities)
          qText += `${q.n}. *${q.label}* (${q.size})\n`;
        qText += '\n🔢 Reply number • "done" to cancel';

        const qMsg = await conn.sendMessage(from, {
          image: { url: film.image },
          caption: qText
        }, { quoted: msg });

        waiting.set(qMsg.key.id, { film, qualities });
        return;
      }

      // Step 2: Select quality
      if (waiting.has(replyTo)) {
        const { film, qualities } = waiting.get(replyTo);
        const pick = qualities.find(p => p.n === parseInt(body));
        if (!pick) return conn.sendMessage(from, { text: '❌ Wrong quality.' }, { quoted: msg });

        const lres = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(pick.link)}`);
        const direct = lres.data?.direct_download || lres.data?.url;
        if (!direct) return conn.sendMessage(from, { text: '❌ No direct link found.' }, { quoted: msg });

        const sz = (pick.size || '').toLowerCase();
        const gb = sz.includes('gb') ? parseFloat(sz) : parseFloat(sz) / 1024;
        if (gb > 2 || isNaN(gb)) {
          return conn.sendMessage(from, {
            text: `⚠️ File too large. Link:\n${direct}`
          }, { quoted: msg });
        }

        const safeName = film.title.replace(/[\\\\/:*?\"<>|]/g, '');
        const fileName = `${BRAND} • ${safeName} • ${pick.label}.mp4`;

        try {
          await conn.sendMessage(from, {
            document: { url: direct },
            mimetype: 'video/mp4',
            fileName,
            caption: `🎬 *${film.title}*\n📊 Size: ${pick.size}\n🔥 ${BRAND}`
          }, { quoted: msg });
          await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } catch {
          await conn.sendMessage(from, {
            text: `❌ Upload failed. Link:\n${direct}`
          }, { quoted: msg });
        }
      }
    };

    conn.ev.on('messages.upsert', handler);
  } catch (e) {
    console.error(e);
    return conn.sendMessage(from, {
      text: `❌ Error: ${e.message}`
    }, { quoted: mek });
  }
});
