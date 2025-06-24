// plugins/cine.js fallback + better no-download-links handling

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
    return conn.sendMessage(from, { text: '*🎬 CineSubz Search*\n\n📌 Usage: .cine <movie name>\n🧪 Example: .cine Deadpool 2\n\n💡 Reply "done" to cancel' }, { quoted: mek });
  }

  try {
    const key = 'cine_' + query.toLowerCase();
    let movies = cache.get(key);

    if (!movies) {
      const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
      if (!res.data?.status) throw new Error('No results found.');
      movies = res.data?.result?.movies;
      if (!Array.isArray(movies) || !movies.length) throw new Error('No results found.');
      cache.set(key, movies);
    }

    const films = movies.map((v, i) => ({
      n: i + 1,
      title: v.title,
      year: v.year,
      imdb: v.imdb,
      link: v.link,
      image: v.image
    }));

    let listText = '*🎬 SEARCH RESULTS*\n\n';
    films.forEach(f => {
      listText += `🎥 ${f.n}. *${f.title}* (${f.year || 'N/A'})\n⭐ IMDB: ${f.imdb || 'N/A'}\n\n`;
    });
    listText += '🔢 Reply number • "done" to cancel';

    const listMsg = await conn.sendMessage(from, { image: { url: films[0].image }, caption: listText }, { quoted: mek });

    const movieListener = async ({ messages }) => {
      const msg = messages?.[0];
      if (!msg?.message?.extendedTextMessage) return;
      const body = msg.message.extendedTextMessage.text.trim();
      const replyTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;
      if (replyTo !== listMsg.key.id) return;

      if (body.toLowerCase() === 'done') {
        conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
        conn.ev.off('messages.upsert', movieListener);
        return;
      }

      const film = films.find(f => f.n === parseInt(body));
      if (!film) {
        return conn.sendMessage(from, { text: '❌ Invalid number.' }, { quoted: msg });
      }

      try {
        const res = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(film.link)}`, { timeout: 10000 });
        const mov = res.data?.result?.data;

        if (!mov || !mov.dl_links || !mov.dl_links.length) {
          await conn.sendMessage(from, { text: '❌ Sorry, download links for this movie are not available currently.\n\nYou can try another movie.' }, { quoted: msg });
          return;
        }

        const qualities = mov.dl_links
          .filter(link => link.link && link.link.trim() !== '')
          .map((link, i) => ({
            n: i + 1,
            label: link.quality || 'Unknown Quality',
            size: link.size || 'Unknown Size',
            link: link.link
          }));

        if (!qualities.length) {
          await conn.sendMessage(from, { text: '❌ Sorry, no valid download links found for this movie.\n\nTry another movie.' }, { quoted: msg });
          return;
        }

        let qText = `*🎬 ${film.title}*\n\n📥 Choose quality:\n\n`;
        qualities.forEach(q => {
          qText += `${q.n}. *${q.label}* (${q.size})\n`;
        });
        qText += '\n🔢 Reply number • "done" to cancel';

        const qMsg = await conn.sendMessage(from, { image: { url: film.image }, caption: qText }, { quoted: msg });

        const qualityListener = async ({ messages }) => {
          const qReply = messages?.[0];
          if (!qReply?.message?.extendedTextMessage) return;
          const qBody = qReply.message.extendedTextMessage.text.trim();
          const qReplyTo = qReply.message.extendedTextMessage.contextInfo?.stanzaId;
          if (qReplyTo !== qMsg.key.id) return;

          if (qBody.toLowerCase() === 'done') {
            conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: qReply });
            conn.ev.off('messages.upsert', qualityListener);
            return;
          }

          const pick = qualities.find(p => p.n === parseInt(qBody));
          if (!pick) {
            return conn.sendMessage(from, { text: '❌ Wrong quality.' }, { quoted: qReply });
          }

          try {
            const direct = pick.link;
            if (!direct) return conn.sendMessage(from, { text: '❌ Direct link not found.' }, { quoted: qReply });

            const sz = (pick.size || '').toLowerCase();
            const gb = sz.includes('gb') ? parseFloat(sz) : parseFloat(sz) / 1024;

            if (gb > 2 || isNaN(gb)) {
              conn.sendMessage(from, { text: `⚠️ File too large (${gb.toFixed(2)} GB). Link:\n${direct}` }, { quoted: qReply });
              conn.ev.off('messages.upsert', qualityListener);
              return;
            }

            const safeTitle = film.title.replace(/[\\/:*?"<>|]/g, '');
            const fname = `${BRAND} • ${safeTitle} • ${pick.label}.mp4`;

            await conn.sendMessage(from, {
              document: { url: direct },
              mimetype: 'video/mp4',
              fileName: fname,
              caption: `🎬 *${film.title}*\n📊 Size: ${pick.size}\n🔥 ${BRAND}`
            }, { quoted: qReply });

            await conn.sendMessage(from, { react: { text: '✅', key: qReply.key } });
          } catch {
            conn.sendMessage(from, { text: `❌ Upload failed. Link:\n${pick.link}` }, { quoted: qReply });
          }

          conn.ev.off('messages.upsert', qualityListener);
        };

        conn.ev.on('messages.upsert', qualityListener);

      } catch (err) {
        console.error(err);
        conn.sendMessage(from, { text: '❌ Failed to fetch movie details.' }, { quoted: msg });
      }

      conn.ev.off('messages.upsert', movieListener);
    };

    conn.ev.on('messages.upsert', movieListener);

  } catch (err) {
    console.error(err);
    conn.sendMessage(from, { text: `❌ Error: ${err.message}` }, { quoted: mek });
  }
});
