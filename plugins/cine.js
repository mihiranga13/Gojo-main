const { cmd } = require('../lib/command');
const axios = require('axios');
const cheerio = require('cheerio');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';

cmd({
  pattern: 'cine',
  alias: ['cines', 'cinesubz'],
  react: '🎬',
  desc: 'Search & download movies from CineSubz (Scrap method)',
  category: 'movie',
  filename: __filename
}, async (conn, mek, m, { from, q }) => {

  const query = (q || '').trim();
  if (!query) {
    return conn.sendMessage(from, { text: '*🎬 Usage:* .cine <movie name>\n_Example:_ .cine Deadpool 2' }, { quoted: mek });
  }

  try {
    const searchUrl = `https://cinesubz.lk/search/${encodeURIComponent(query)}`;
    const { data } = await axios.get(searchUrl);
    const $ = cheerio.load(data);

    const results = [];
    $('.movies-list .ml-item').each((i, el) => {
      const title = $(el).find('h2').text().trim();
      const link = $(el).find('a').attr('href');
      const image = $(el).find('img').attr('src');
      if (title && link) results.push({ n: i + 1, title, link, image });
    });

    if (!results.length) {
      return conn.sendMessage(from, { text: '❌ No results found.' }, { quoted: mek });
    }

    let listText = '*🎬 Search Results*\n\n';
    for (const m of results) {
      listText += `${m.n}. *${m.title}*\n`;
    }
    listText += '\n_Reply number • "done" to cancel_';

    const listMsg = await conn.sendMessage(from, {
      image: { url: results[0].image },
      caption: listText
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

      if (replyTo === listMsg.key.id) {
        const movie = results.find(m => m.n === parseInt(body));
        if (!movie) {
          return conn.sendMessage(from, { text: '❌ Invalid number.' }, { quoted: msg });
        }

        const moviePage = await axios.get(movie.link);
        const $$ = cheerio.load(moviePage.data);

        const qualityLinks = [];
        $$('.mvici-right a').each((i, el) => {
          const qLink = $(el).attr('href');
          const label = $(el).text().trim();
          if (qLink && label.match(/480|720|1080/)) {
            qualityLinks.push({ n: i + 1, label, link: qLink });
          }
        });

        if (!qualityLinks.length) {
          return conn.sendMessage(from, { text: '❌ No valid qualities found.' }, { quoted: msg });
        }

        let qText = `*🎬 ${movie.title}*\n\n📥 Choose Quality:\n\n`;
        for (const q of qualityLinks) {
          qText += `${q.n}. *${q.label}*\n`;
        }
        qText += '\n_Reply number • "done" to cancel_';

        const qMsg = await conn.sendMessage(from, {
          image: { url: movie.image },
          caption: qText
        }, { quoted: msg });

        waiting.set(qMsg.key.id, { movie, qualityLinks });
      }

      if (waiting.has(replyTo)) {
        const { movie, qualityLinks } = waiting.get(replyTo);
        const choice = qualityLinks.find(q => q.n === parseInt(body));
        if (!choice) {
          return conn.sendMessage(from, { text: '❌ Invalid quality selection.' }, { quoted: msg });
        }

        const safeTitle = movie.title.replace(/[\\/:*?"<>|]/g, '');
        const fileName = `${BRAND} • ${safeTitle} • ${choice.label}.mp4`;

        await conn.sendMessage(from, {
          document: { url: choice.link },
          mimetype: 'video/mp4',
          fileName: fileName,
          caption: `🎬 *${movie.title}*\n🔥 ${BRAND}`
        }, { quoted: msg });

        conn.ev.off('messages.upsert', handler);
      }
    };

    conn.ev.on('messages.upsert', handler);

  } catch (e) {
    console.error(e);
    conn.sendMessage(from, { text: '❌ Error fetching movie.' }, { quoted: mek });
  }
});
