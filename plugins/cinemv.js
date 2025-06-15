/************************************************************************
 *  GOJO-MD – Cinesubz Downloader
 *  fixed: Cloudflare 403, Baileys v6, dead-link handling
 ************************************************************************/
const { cmd } = require('../lib/command');
const axios = require('axios');

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const BASES = {
  primary: 'https://cinesubz-api-zazie.vercel.app/api',
  backup:  'https://cine-api-by-tharuwa.xyz/api/cinesubz'
};
const HEADERS = { 'User-Agent': UA, Referer: 'https://cinesubz.co/' };

/* ───────── helpers ───────── */
function nowLK() {
  const d = new Date(Date.now() + 5.5 * 3600 * 1000);
  return d.toISOString().replace('T', ' ').split('.')[0] + ' +0530';
}

async function fetchJSON(url) {
  return axios.get(url, { headers: HEADERS, timeout: 12_000 }).then(r => r.data);
}

async function searchCinesubz(q) {
  const urls = [
    `${BASES.primary}/search?q=${encodeURIComponent(q)}`,
    `${BASES.backup}/search?query=${encodeURIComponent(q)}`
  ];
  for (const u of urls) {
    try {
      const data = await fetchJSON(u);
      const list = data.result?.data ?? data.results ?? [];
      if (Array.isArray(list) && list.length) {
        return list.slice(0, 10).map(m => ({
          title: m.title || 'Unknown',
          link : m.link  || m.url || '',
          year : m.year  || 'N/A'
        }));
      }
    } catch (_) { /* try next mirror */ }
  }
  return [];
}

async function movieDetails(url) {
  const api = `${BASES.primary}/movie?url=${encodeURIComponent(url)}`;
  const alt = `${BASES.backup}/movie?link=${encodeURIComponent(url)}`;
  for (const u of [api, alt]) {
    try {
      const data = await fetchJSON(u);
      const m = data.result?.data ?? data;
      if (!m) continue;
      const links = m.dl_links || m.links || [];
      if (!links.length) throw 'no links';
      return {
        title  : m.title || 'Unknown',
        imdb   : m.imdbRate || 'N/A',
        date   : m.date || 'N/A',
        country: m.country || 'N/A',
        runtime: m.duration || 'N/A',
        image  : m.image || '',
        dl     : links.map(l => ({
          quality: l.quality || l.label || 'Unknown',
          size   : l.size || '??',
          url    : l.link || l.url || ''
        }))
      };
    } catch (_) { /* try next */ }
  }
  throw new Error('Movie details unavailable (all mirrors failed)');
}

async function linkAlive(u) {
  try {
    await axios.head(u, { headers: HEADERS, timeout: 8000, maxRedirects: 4 });
    return true;
  } catch (_) { return false; }
}

/* ───────── state maps for reply tracking ───────── */
const searchMap   = {};
const downloadMap = {};
let   connRef;

/* one-time reply handler */
if (!global.__cineListener) {
  global.__cineListener = true;
  const { setTimeout } = require('timers');
  (function wait() {
    if (!connRef) return setTimeout(wait, 400);
    connRef.ev.on('messages.upsert', async ({ messages = [] }) => {
      const m = messages[0];
      if (!m?.message) return;
      const body = m.message.conversation ||
                   m.message.extendedTextMessage?.text || '';
      const qId  = m.message?.extendedTextMessage?.contextInfo?.stanzaId;
      const from = m.key.remoteJid;

      /* stage 1 ─ user picked a movie from search list */
      if (qId && searchMap[qId]) {
        const idx = Number(body.trim());
        if (!(idx > 0 && idx <= searchMap[qId].length))
          return connRef.sendMessage(from,
            { text: '❌ Invalid number.' }, { quoted: m });

        const movie = searchMap[qId][idx - 1];
        let info;
        try {
          await connRef.sendMessage(from, { react: { text: '⏳', key: m.key }});
          info = await movieDetails(movie.link);
        } catch (e) {
          return connRef.sendMessage(from,
            { text: `❌ ${e.message}` }, { quoted: m });
        }

        let txt = `🎬 *${info.title}*\n\n*Choose a quality:*\n`;
        info.dl.forEach((x,i)=>{ txt += `\n${i+1}. ${x.quality} – ${x.size}`;});
        txt += `\n\n📩 Reply with a number (1-${info.dl.length}).`;
        const sent = await connRef.sendMessage(from,{ text: txt},{quoted: m});
        downloadMap[sent.key.id] = info;
        return;
      }

      /* stage 2 ─ user picked a quality */
      if (qId && downloadMap[qId]) {
        const info = downloadMap[qId];
        const idx  = Number(body.trim());
        if (!(idx > 0 && idx <= info.dl.length))
          return connRef.sendMessage(from,
            { text: '❌ Invalid number.' }, { quoted: m });

        const link = info.dl[idx-1];
        await connRef.sendMessage(from,{ react:{text:'⬇️',key:m.key}});

        if (await linkAlive(link.url)) {
          return connRef.sendMessage(
            from,
            {
              document: { url: link.url },
              mimetype: 'video/mp4',
              fileName: `${info.title}-${link.quality}.mp4`,
              caption:
`🎥 *${info.title}* (${link.quality})
⭐ IMDb: ${info.imdb}
📅 ${info.date} | ${info.country}
⏳ ${info.runtime}

© 2025 GOJO MD`,
              contextInfo: { externalAdReply: {
                title: info.title, body: 'GOJO CINEMA',
                thumbnailUrl: info.image, mediaType: 1,
                sourceUrl: link.url, renderLargerThumbnail: true
              }}
            },
            { quoted: m }
          );
        } else {
          return connRef.sendMessage(
            from,
            { text:
`⚠️ Auto-download blocked (403/404).
👉 Manually open:\n${link.url}` },
            { quoted: m }
          );
        }
      }
    });
  })();
}

/* ───────── main command ───────── */
cmd({
  pattern : 'cine',
  alias   : ['film','subfilm','cinemv'],
  category: 'movie',
  desc    : 'Search & download movies from CineSubz',
  react   : '🎬',
  filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
  connRef = conn;                             // for the global listener
  const query = q.trim();
  if (!query) return reply('📝 Use `.cine <movie name>`');

  try {
    await conn.sendMessage(from, { react:{text:'🔍',key:mek.key}});
    const list = await searchCinesubz(query);
    if (!list.length)
      return reply('😓 Nothing found. Try another title.');

    let txt = `✨ *GOJO MD CINEMA* ✨\n` +
              `🔎 Results for *"${query}"* (${nowLK()})\n\n`;
    list.forEach((m,i)=>{ txt+= `${i+1}. ${m.title} (${m.year})\n`;});
    txt += '\n📩 Reply with a number to select.';
    const sent = await conn.sendMessage(from,{ text: txt },{quoted: mek});
    searchMap[sent.key.id] = list;
  } catch (e) {
    console.error(e);
    reply(`❌ Error: ${e.message}`);
  }
});
