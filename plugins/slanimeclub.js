/**
 * plugins/animexin.js
 * Search / detail / download from animexin.dev
 * ─ npm i axios node-cache
*/

const axios      = require('axios');
const NodeCache  = require('node-cache');
const { cmd }    = require('../lib/command');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐀𝐍𝐈𝐌𝐄☢️☘';
const cache = new NodeCache({ stdTTL: 300, checkperiod: 120 });
const BASE  = 'https://vajiraapi-1a3e8153ea68.herokuapp.com/movie';

cmd({
  pattern : 'animexin',
  react   : '🌀',
  category: 'anime',
  desc    : 'Animexin search / download',
  filename: __filename
}, async (conn, m, mek, { from, q }) => {
  if (!q) return conn.sendMessage(from, { text: '📌 *.animexin <search term | animexin.dev url>*' }, { quoted: mek });

  const isUrl = q.includes('animexin.dev');
  const sessions = new Map();

  const handler = async ({ messages }) => {
    const msg   = messages?.[0];
    if (!msg?.message?.extendedTextMessage) return;
    const body  = msg.message.extendedTextMessage.text.trim();
    const repId = msg.message.extendedTextMessage.contextInfo?.stanzaId;

    if (body.toLowerCase() === 'done') {
      conn.ev.off('messages.upsert', handler);
      sessions.clear();
      return conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
    }

    // pick from list
    if (sessions.has(repId) && sessions.get(repId).stage === 'pick') {
      const list = sessions.get(repId).data;
      const n    = parseInt(body);
      if (!n || n < 1 || n > list.length) return conn.sendMessage(from, { text: '❌ Invalid.' }, { quoted: msg });
      const item = list[n - 1];
      return processDetail(item.url, msg);
    }
  };

  conn.ev.on('messages.upsert', handler);

  const processDetail = async (url, replyTo) => {
    try {
      const d = (await axios.get(`${BASE}/animexinDetail`, { params: { url }, timeout: 10000 })).data;
      if (!d?.videoUrl) throw 0;

      // big file? (>2GB)
      const mb = (d.size || '').toLowerCase().includes('gb')
        ? parseFloat(d.size) * 1024
        : parseFloat(d.size || '0');
      if (mb > 2048) {
        await conn.sendMessage(from, { text: `⚠️ File too big. Link:\n${d.videoUrl}` }, { quoted: replyTo });
      } else {
        const name = `${BRAND} • ${d.title.replace(/[\\/:*?"<>|]/g, '')}.mp4`;
        await conn.sendMessage(from, {
          document: { url: d.videoUrl },
          mimetype: 'video/mp4',
          fileName: name,
          caption : `🎌 *${d.title}*\n📊 ${d.size || ''}\n\n🔥 ${BRAND}`
        }, { quoted: replyTo });
      }
    } catch {
      await conn.sendMessage(from, { text: '❌ Failed to fetch.' }, { quoted: replyTo });
    }
    conn.ev.off('messages.upsert', handler);
    sessions.clear();
  };

  if (isUrl) return processDetail(q, mek);

  // search
  const key = 'ax_' + q.toLowerCase();
  let data  = cache.get(key);
  if (!data) {
    try {
      data = (await axios.get(`${BASE}/animexinSearch`, { params: { text: q }, timeout: 10000 })).data;
      if (!Array.isArray(data) || !data.length) throw 0;
      cache.set(key, data);
    } catch {
      return conn.sendMessage(from, { text: '❌ No results.' }, { quoted: mek });
    }
  }

  let cap = '*🎌 ANIMEXIN RESULTS*\n\n';
  data.slice(0, 10).forEach((x, i) => cap += `🔹 ${i + 1}. *${x.title}*\n`);
  cap += '\n🔢 Reply number • "done" to cancel';

  const listMsg = await conn.sendMessage(from, { image: { url: data[0].thumbnail || '' }, caption: cap }, { quoted: mek });
  sessions.set(listMsg.key.id, { stage: 'pick', data });
});