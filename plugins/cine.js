const { cmd } = require('../lib/command');
const axios = require('axios');
const cheerio = require('cheerio');
const os = require('os');

const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
  'Accept-Language': 'en-US,en;q=0.9',
  'Referer': 'https://google.com',
};

async function searchMovies(query) {
  const res = await axios.get(`https://cinesubz.co/?s=${encodeURIComponent(query)}`, { headers });
  const $ = cheerio.load(res.data);
  return $('article').map((_, el) => ({
    name: $(el).find('.details .title a').text().trim(),
    image: $(el).find('.image .thumbnail img').attr('src'),
    desc: $(el).find('.details .contenido p').text().trim(),
    year: $(el).find('.details .meta .year').text().trim(),
    imdb: $(el).find('.details .meta .rating:first').text().replace('IMDb', '').trim(),
    link: $(el).find('.image .thumbnail a').attr('href')
  })).get();
}

async function getDownloadLinks(movieUrl) {
  const res = await axios.get(movieUrl, { headers });
  const $ = cheerio.load(res.data);
  return $('a[href^="https://cinesubz.co/api-"]').map((_, el) => ({
    link: $(el).attr('href'),
    quality: $(el).text().trim(),
    size: $(el).closest('li').next().text().trim()
  })).get();
}

async function modifyLink(url) {
  const res = await axios.get(url, { headers });
  const $ = cheerio.load(res.data);
  let mod = $('#link').attr('href') || url;
  mod = mod.replace(/https:\/\/google\.com\/server\d{2}\/1:\//, "https://cinescloud.cskinglk.xyz/server1/")
           .replace(/\.mp4\??/, "?ext=mp4")
           .replace(/\.mkv\??/, "?ext=mkv")
           .replace(/\.zip\??/, "?ext=zip");
  return mod;
}

async function fetchFileDetails(url) {
  const jsonRes = await axios.post(url, { direct: true }, { headers: { 'Content-Type': 'application/json' } });
  const page = await axios.get(url);
  const $ = cheerio.load(page.data);
  jsonRes.data.fileSize = $('p.file-info span').text().trim() || "Unknown";
  return jsonRes.data;
}

cmd({
  pattern: "cine",
  alias: ["movie"],
  use: ".film <query>",
  desc: "Search and download movies.",
  category: "search",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  if (!q) return reply('🎬 Provide movie name.');

  const hostMap = { 12: "𝚁𝙴𝙿𝙻𝙸𝚃", 36: "𝙷𝙴𝚁𝙾𝙺𝚄", 8: "𝙺𝙾𝚈𝙴𝙱" };
  const platform = hostMap[os.hostname().length] || "𝚅𝙿𝚂";

  const movies = await searchMovies(q);
  if (!movies.length) return reply('❌ No results found.');

  let txt = "🎥 *Movie Results*\nReply with number to select:\n\n";
  movies.forEach((m, i) => txt += `${i + 1}️⃣ *${m.name}*\n\n`);

  const sent = await conn.sendMessage(from, { image: { url: "https://files.catbox.moe/5o29vp.png" }, caption: txt }, { quoted: mek });

  const movieListener = async (msgUpdate) => {
    const msg = msgUpdate.messages[0];
    if (!msg.message?.extendedTextMessage) return;
    if (msg.message.extendedTextMessage.contextInfo?.stanzaId !== sent.key.id) return;
    conn.ev.off('messages.upsert', movieListener);

    const idx = parseInt(msg.message.extendedTextMessage.text) - 1;
    if (idx < 0 || idx >= movies.length) return reply('❌ Invalid choice.', msg);

    const mData = movies[idx];
    const links = (await getDownloadLinks(mData.link)).filter(l => !l.quality.includes("Telegram"));

    if (!links.length) return reply('❌ No valid links.');

    let detail = `🎬 *${mData.name}* (${mData.year})\n⭐ IMDb: ${mData.imdb}\n📝 ${mData.desc}\n\nReply with quality number:\n\n`;

    const files = [];
    for (let i = 0; i < links.length; i++) {
      const modLink = await modifyLink(links[i].link);
      const file = await fetchFileDetails(modLink);
      files.push(file);
      if (file.url) detail += `${i + 1}️⃣ *${links[i].quality}* - ${file.fileSize}\n`;
    }

    const sent2 = await conn.sendMessage(from, { image: { url: mData.image }, caption: detail }, { quoted: msg });

    const qualityListener = async (msg2Update) => {
      const msg2 = msg2Update.messages[0];
      if (!msg2.message?.extendedTextMessage) return;
      if (msg2.message.extendedTextMessage.contextInfo?.stanzaId !== sent2.key.id) return;
      conn.ev.off('messages.upsert', qualityListener);

      const id2 = parseInt(msg2.message.extendedTextMessage.text) - 1;
      if (id2 < 0 || id2 >= files.length || !files[id2].url) return reply('❌ Invalid choice.', msg2);

      const fileSizeMB = parseFloat(files[id2].fileSize) * (files[id2].fileSize.includes("GB") ? 1024 : 1);
      if (["𝙷𝙴𝚁𝙾𝙺𝚄", "𝙺𝙾𝚈𝙴𝙱"].includes(platform)) return reply(`🚫 Cannot send large files on ${platform}.`, msg2);
      if (fileSizeMB > 2000) return reply('🚫 File exceeds 2GB limit.', msg2);

      await conn.sendMessage(from, {
        document: { url: files[id2].url },
        mimetype: "video/mp4",
        fileName: `${mData.name}.mp4`,
        caption: `🎥 ${mData.name}\nYear: ${mData.year}\n⭐ Rating: ${mData.imdb}\nSize: ${files[id2].fileSize}\n📝 ${mData.desc}`
      }, { quoted: msg2 });
    };

    conn.ev.on('messages.upsert', qualityListener);
  };

  conn.ev.on('messages.upsert', movieListener);
});
