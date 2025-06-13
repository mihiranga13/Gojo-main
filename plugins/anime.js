const config = require('../settings');
const { cmd } = require('../lib/command');
const { getBuffer, fetchJson } = require('../lib/functions');
const { sizeFormatter } = require('human-readable');
const GDriveDl = require('../lib/gdrive.js');

const N_FOUND = "*I couldn't find anything :(*";

/* ─────────────── helpers ─────────────── */
const formatSize = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  render: (n, symbol) => `${n} ${symbol}B`
});

const API = "https://vajira-movie-api.vercel.app/api/slanimeclub";

/* ─────────────── .slanimeclub (search) ─────────────── */
cmd({
  pattern: "slanimeclub",
  react: '📑',
  category: "movie",
  desc: "Search on slanimeclub",
  filename: __filename
}, async (conn, m, mek, { from, prefix, q, reply }) => {
  try {
    if (!q) return await reply('*Please give me a title 🖊️*');

    const data = await fetchJson(`${API}/search?q=${encodeURIComponent(q)}&apikey=vajiraofficial`);
    const results = data?.data?.data?.data;

    if (!results?.length) return conn.sendMessage(from, { text: N_FOUND }, { quoted: mek });

    /* 👉 searchRows → var/let පාවිච්චි නොකර const */
    const searchRows = results.map((item, i) => ({
      title: `${i + 1}`,
      description: item.title,
      rowId: `${prefix}slanime ${item.link}`
    }));

    const listMessage = {
      text: '',
      footer: config.FOOTER,
      title: 'Result from slanimeclub 📲',
      buttonText: '*🔢 Reply below number*',
      sections: [{ title: "_[Result from slanimeclub.]_", rows: searchRows }]
    };

    return conn.replyList(from, listMessage, { quoted: mek });
  } catch (err) {
    console.error(err);
    reply('*ERROR !!*');
  }
});

/* ─────────────── .slanime (movie / tvshow details) ─────────────── */
cmd({
  pattern: "slanime",
  react: '📑',
  category: "movie",
  desc: "slanimeclub movie / tvshow handler",
  filename: __filename
}, async (conn, m, mek, { from, prefix, q, reply }) => {
  try {
    if (!q) return reply('*Please give me a URL 🖊️*');

    /* 🄰  MOVIE -------------------------------------------------- */
    if (q.includes("slanimeclub.co/movies")) {
      const data = await fetchJson(`${API}/movie?url=${q}&apikey=vajiraofficial`);
      const movie = data?.data?.data?.moviedata;
      if (!movie) return reply(N_FOUND);

      const caption =
        `*🌿 Title:* ${movie.title}\n` +
        `*📅 Date:* ${movie.date}\n` +
        `*🎭 Genres:* ${movie.generous}\n\n` +
        `*🔗 Link:* ${q}`;

      if (!movie.seasons?.length) return reply(N_FOUND);

      const seasonRows = movie.seasons.map((s, i) => ({
        title: `${i + 1}`,
        description: `${s.title} | ${s.number} | ${s.date}`,
        rowId: `${prefix}slanimedl ${s.link}|${s.title}`
      }));

      const listMessage = {
        caption,
        image: { url: movie.image },
        footer: config.FOOTER,
        title: 'Result from slanimeclub 📲',
        buttonText: '*🔢 Reply below number*',
        sections: [{ title: "_[Result from slanimeclub.]_", rows: seasonRows }]
      };

      return conn.replyList(from, listMessage, { quoted: mek });
    }

    /* 🄱  TV-SHOW ------------------------------------------------ */
    if (q.includes("slanimeclub.co/tvshow")) {
      const data = await fetchJson(`${API}/tvshow?url=${q}&apikey=vajiraofficial`);
      const show = data?.data?.data;
      if (!show?.episodes?.length)
        return reply(N_FOUND);

      const episodeRows = show.episodes.map((ep, i) => ({
        title: `${i + 1}`,
        description: `${ep.title}\n📅 ${ep.date}`,
        rowId: `${prefix}slanimedl ${ep.link}|${ep.title}`
      }));

      const listMessage = {
        text: '',
        footer: config.FOOTER,
        title: 'Result from slanimeclub 📲',
        buttonText: '*🔢 Reply below number*',
        sections: [{ title: "_[Result from slanimeclub.]_", rows: episodeRows }]
      };

      return conn.replyList(from, listMessage, { quoted: mek });
    }

    /* ❌ Unsupported link */
    reply('*URL type not recognised*');
  } catch (err) {
    console.error(err);
    reply('*ERROR !!*');
  }
});

/* ─────────────── .slanimedl (download) ─────────────── */
cmd({
  pattern: 'slanimedl',
  react: "📥",
  dontAddCommandList: true,
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply('*Please provide a direct URL!*');

  try {
    const [mediaUrl, title = 'slanime_movie'] = q.split('|');

    const data = await fetchJson(`${API}/download?url=${mediaUrl}&apikey=vajiraofficial`);
    const dlLink = data?.data?.data?.link;
    if (!dlLink) return reply('*Unable to fetch download link.*');

    await reply('📥 Uploading your movie… Please wait…');

    /* ── direct slanime link ── */
    if (dlLink.includes("slanimeclub.co")) {
      const buf = await getBuffer(dlLink);
      return conn.sendMessage(from, {
        document: buf,
        caption: `${title}\n\n${config.FOOTER}`,
        fileName: `${title}.mp4`,
        mimetype: "video/mp4"
      }, { quoted: mek });
    }

    /* ── Google-Drive link ── */
    if (dlLink.includes("drive.google.com")) {
      const g = await GDriveDl(dlLink);
      if (g.error) return reply('*Google Drive link is not downloadable (quota?).*');

      await reply(`*Downloading…*\nName: ${g.fileName}\nSize: ${g.fileSize}\nType: ${g.mimetype}`);

      return conn.sendMessage(from, {
        document: { url: g.downloadUrl },
        caption: `${g.fileName}\n\n${config.FOOTER}`,
        fileName: g.fileName,
        mimetype: g.mimetype
      }, { quoted: mek });
    }

    /* ── fallback ── */
    reply('*Unsupported download link format.*');

  } catch (err) {
    console.error(err);
    reply('*Error fetching or sending*');
  }
});
