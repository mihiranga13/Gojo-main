const l = console.log;
const config = require('../settings');
const { cmd } = require('../lib/command');
const axios = require('axios');
const NodeCache = require('node-cache');
const searchCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

// WhatsApp document-card එකේ දිස්වන brand watermark එක
const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';

cmd(
  {
    pattern: 'cine',
    react: '🎬',
    desc: 'Search and download Movies/TV Series',
    category: 'media',
    filename: __filename,
  },
  async (conn, mek, m, { from, q }) => {
    if (!q) {
      return await conn.sendMessage(
        from,
        {
          text:
            '*🎬 Movie / TV Series Search*\n\n' +
            '📋 Usage: .cine <search term>\n' +
            '📝 Example: .cine Breaking Bad\n\n' +
            "💡 Reply 'done' to stop the process",
        },
        { quoted: mek }
      );
    }

    try {
      const cacheKey = `film_${q.toLowerCase()}`;
      let data = searchCache.get(cacheKey);

      if (!data) {
        const url = `https://api.laka.wtf/movie/cinesubz/search?q=${encodeURIComponent(q)}`;
        let retries = 3;
        while (retries--) {
          try {
            const r = await axios.get(url, { timeout: 10000 });
            data = r.data;
            if (data?.status && data.results?.length) break;
            throw new Error('No results');
          } catch (err) {
            if (!retries) throw new Error('Failed to retrieve data');
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
        searchCache.set(cacheKey, data);
      }

      const films = data.results.map((f, i) => ({
        n: i + 1,
        title: f.title,
        imdb: f.imdb,
        year: f.year,
        link: f.link,
        image: f.image,
      }));

      let txt = '*🎬 SEARCH RESULTS*\n\n';
      for (const f of films) {
        txt += `🎥 ${f.n}. *${f.title}*\n   ⭐ IMDB: ${f.imdb}\n   📅 Year: ${f.year}\n\n`;
      }
      txt += '🔢 Reply number • "done" to cancel';

      const listMsg = await conn.sendMessage(
        from,
        { image: { url: films[0].image }, caption: txt },
        { quoted: mek }
      );

      const waiting = new Map();

      const handler = async ({ messages }) => {
        const msg = messages?.[0];
        if (!msg?.message?.extendedTextMessage) return;

        const body = msg.message.extendedTextMessage.text.trim();
        const replyTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;

        if (body.toLowerCase() === 'done') {
          conn.ev.off('messages.upsert', handler);
          waiting.clear();
          return await conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
        }

        if (replyTo === listMsg.key.id) {
          const film = films.find((f) => f.n === parseInt(body));
          if (!film) return await conn.sendMessage(from, { text: '❌ Invalid number.' }, { quoted: msg });

          const lUrl = `https://api.laka.wtf/movie/cinesubz/dl?url=${encodeURIComponent(film.link)}`;
          let dl;
          let r = 3;
          while (r--) {
            try {
              dl = (await axios.get(lUrl, { timeout: 10000 })).data;
              if (dl?.status) break;
              throw new Error();
            } catch {
              if (!r) return await conn.sendMessage(from, { text: '❌ Fetch failed.' }, { quoted: msg });
              await new Promise((d) => setTimeout(d, 1000));
            }
          }

          const links = dl.movie.download_links;
          const picks = [];
          const sd = links.find((x) => x.quality === 'SD 480p' && x.direct_download);
          const hd =
            links.find((x) => x.quality === 'HD 720p' && x.direct_download) ||
            links.find((x) => x.quality === 'FHD 1080p' && x.direct_download);

          if (sd) picks.push({ n: 1, q: 'SD', ...sd });
          if (hd) picks.push({ n: 2, q: 'HD', ...hd });

          if (!picks.length) return await conn.sendMessage(from, { text: '❌ No links available.' }, { quoted: msg });

          let qTxt = `*🎬 ${film.title}*\n\n📥 Choose Quality:\n\n`;
          for (const p of picks) qTxt += `${p.n}. *${p.q}* (${p.size})\n`;
          qTxt += '\n🔢 Reply number • "done" to cancel';

          const qMsg = await conn.sendMessage(
            from,
            { image: { url: dl.movie.thumbnail || film.image }, caption: qTxt },
            { quoted: msg }
          );

          waiting.set(qMsg.key.id, { film, picks });
          return;
        }

        if (waiting.has(replyTo)) {
          const { film, picks } = waiting.get(replyTo);
          const pick = picks.find((p) => p.n === parseInt(body));
          if (!pick) return await conn.sendMessage(from, { text: '❌ Wrong quality.' }, { quoted: msg });

          const sz = pick.size.toLowerCase();
          const gb = sz.includes('gb') ? parseFloat(sz) : parseFloat(sz) / 1024;

          if (gb > 2) {
            return await conn.sendMessage(from, { text: `⚠️ Too large. Direct link:\n${pick.direct_download}` }, { quoted: msg });
          }

          const safe = film.title.replace(/[\\/:*?"<>|]/g, '');
          const fname = `${BRAND} • ${safe} • ${pick.q}.mp4`;

          try {
            await conn.sendMessage(
              from,
              {
                document: { url: pick.direct_download },
                mimetype: 'video/mp4',
                fileName: fname,
                caption: `🎬 *${film.title}*\n📊 Size: ${pick.size}\n\n🔥 ${BRAND}`,
              },
              { quoted: msg }
            );
            await conn.sendMessage(from, { react: { text: '✅', key: msg.key } });
          } catch {
            await conn.sendMessage(from, { text: `❌ Failed. Direct link:\n${pick.direct_download}` }, { quoted: msg });
          }
        }
      };

      conn.ev.on('messages.upsert', handler);
    } catch (e) {
      console.error(e);
      await conn.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: mek });
    }
  }
);

