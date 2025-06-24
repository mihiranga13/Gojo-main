// plugins/cine.js – CineSubz Search & Download Stable Version
// Dependencies: axios, node-cache

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
},
async (conn, mek, m, { from, q }) => {

  const query = (q || '').trim();
  if (query.length < 2) {
    return conn.sendMessage(from, { text: '*🎬 CineSubz Search*\n\n📌 Usage: .cine <movie name>\n🧪 Example: .cine Deadpool 2\n\n💡 Reply "done" to cancel' }, { quoted: mek });
  }

  try {
    const key = 'cine_' + query.toLowerCase();
    let results = cache.get(key);

    if (!results) {
      const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      if (!res.data?.status || !Array.isArray(res.data.results) || !res.data.results.length) throw new Error('No results found.');
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

    let listText = '*🎬 SEARCH RESULTS*\n\n';
    films.forEach(f => {
      listText += `🎥 ${f.n}. *${f.title}* (${f.year || 'N/A'})\n⭐ IMDB: ${f.imdb || 'N/A'}\n\n`;
    });
    listText += '🔢 Reply with number to select movie • "done" to cancel';

    const listMsg = await conn.sendMessage(from, { image: { url: films[0].image }, caption: listText }, { quoted: mek });

    const movieReply = msg => {
      const body = msg.message?.extendedTextMessage?.text?.trim();
      const replyTo = msg.message?.extendedTextMessage?.contextInfo?.stanzaId;
      if (replyTo !== listMsg.key.id) return;

      if (body?.toLowerCase() === 'done') {
        conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
        conn.ev.off('messages.upsert', movieListener);
        return;
      }

      const film = films.find(f => f.n === parseInt(body));
      if (!film) {
        conn.sendMessage(from, { text: '❌ Invalid number.' }, { quoted: msg });
        return;
      }

      getMovieQualities(film, msg);
      conn.ev.off('messages.upsert', movieListener);
    };

    const movieListener = ({ messages }) => {
      if (!messages || !messages[0]) return;
      movieReply(messages[0]);
    };

    conn.ev.on('messages.upsert', movieListener);

    const getMovieQualities = async (film, msg) => {
      let mov;
      try {
        const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(film.link)}`, { timeout: 10000 });
        mov = res.data;
      } catch {
        return conn.sendMessage(from, { text: '❌ Failed to fetch details.' }, { quoted: msg });
      }

      if (!mov?.status || !mov.qualities?.length) {
        return conn.sendMessage(from, { text: '❌ No qualities found.' }, { quoted: msg });
      }

      const qualities = mov.qualities.filter(q => q.label.match(/480|720|1080/)).map((q, i) => ({
        n: i + 1,
        label: q.label,
        size: q.size,
        link: q.url || q.link
      }));

      if (!qualities.length) {
        return conn.sendMessage(from, { text: '❌ No valid qualities.' }, { quoted: msg });
      }

      let qText = `*🎬 ${film.title}*\n\n📥 Choose quality:\n\n`;
      qualities.forEach(q => {
        qText += `${q.n}. *${q.label}* (${q.size})\n`;
      });
      qText += '\n🔢 Reply with number to select quality • "done" to cancel';

      const qMsg = await conn.sendMessage(from, { image: { url: film.image }, caption: qText }, { quoted: msg });

      const qualityReply = replyMsg => {
        const qBody = replyMsg.message?.extendedTextMessage?.text?.trim();
        const qReplyTo = replyMsg.message?.extendedTextMessage?.contextInfo?.stanzaId;
        if (qReplyTo !== qMsg.key.id) return;

        if (qBody?.toLowerCase() === 'done') {
          conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: replyMsg });
          conn.ev.off('messages.upsert', qualityListener);
          return;
        }

        const pick = qualities.find(p => p.n === parseInt(qBody));
        if (!pick) {
          conn.sendMessage(from, { text: '❌ Wrong quality.' }, { quoted: replyMsg });
          return;
        }

        sendMovie(pick, film, replyMsg);
        conn.ev.off('messages.upsert', qualityListener);
      };

      const qualityListener = ({ messages }) => {
        if (!messages || !messages[0]) return;
        qualityReply(messages[0]);
      };

      conn.ev.on('messages.upsert', qualityListener);
    };

    const sendMovie = async (pick, film, msg) => {
      let linkRes;
      try {
        const lUrl = `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(pick.link)}`;
        linkRes = (await axios.get(lUrl, { timeout: 10000 })).data;
      } catch {
        return conn.sendMessage(from, { text: '❌ Failed to resolve link.' }, { quoted: msg });
      }

      const direct = linkRes?.direct_download || linkRes?.url;
      if (!direct) return conn.sendMessage(from, { text: '❌ Direct link not found.' }, { quoted: msg });

      const sz = (pick.size || '').toLowerCase();
      const gb = sz.includes('gb') ? parseFloat(sz) : parseFloat(sz) / 1024;

      if (gb > 2 || isNaN(gb)) {
        return conn.sendMessage(from, { text: `⚠️ File too large (${gb.toFixed(2)} GB).\n🔗 Link: ${direct}` }, { quoted: msg });
      }

      const safeTitle = film.title.replace(/[\\/:*?"<>|]/g, '');
      const fname = `${BRAND} • ${safeTitle} • ${pick.label}.mp4`;

      try {
        await conn.sendMessage(from, {
          document: { url: direct },
          mimetype: 'video/mp4',
          fileName: fname,
          caption: `🎬 *${film.title}*\n📊 Size: ${pick.size}\n🔥 ${BRAND}`
        }, { quoted: msg });
        await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
      } catch {
        conn.sendMessage(from, { text: `❌ Upload failed.\n🔗 Link: ${direct}` }, { quoted: msg });
      }
    };

  } catch (err) {
    console.error(err);
    conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
  }

});
