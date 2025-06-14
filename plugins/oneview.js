/**
 * vv.js  |  GOJO-MD
 * --------------------------------------
 * Owner-only command to retrieve **View-Once** media
 * Usage :  reply to a view-once img / vid / audio   ➜   .vv
 */

const { cmd } = require("../lib/command");

cmd({
  pattern : "vv",
  alias   : ["viewonce", "retrieve"],
  react   : "🐳",
  desc    : "Owner-only | Retrieve view-once image / video / audio",
  category: "owner",
  filename: __filename
}, async (conn, m, text, { from, isCreator, reply }) => {
  try {
    /* ── owner check ───────────────────── */
    if (!isCreator)
      return reply("📛 මේක owner ට විතරයි.");

    /* ── make sure user replied to view-once ─ */
    const q = m.quoted;
    if (!q || !q.isViewOnce)
      return reply("🍁 කරුණාකර *view-once message* එකකට reply කරන්න.");

    /* ── unlock the view-once flag ────────── */
    q.message[q.mtype].viewOnce = false;

    /* ── download media ───────────────────── */
    const buffer = await q.download();
    const cap    = q.text || "";
    const sendOpt = { quoted: m };

    /* ── resend according to type ─────────── */
    if (q.mtype === "imageMessage") {
      await conn.sendMessage(from, { image: buffer, caption: cap }, sendOpt);
    }
    else if (q.mtype === "videoMessage") {
      await conn.sendMessage(from, { video: buffer, caption: cap }, sendOpt);
    }
    else if (q.mtype === "audioMessage") {
      await conn.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: q.ptt || false
      }, sendOpt);
    }
    else {
      return reply("❌ Image / Video / Audio විතරක් support වෙන්නෙ.");
    }

    /* ── success react ───────────────────── */
    await conn.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (err) {
    console.error("vv error ➜", err);
    reply("❌ Error: " + err.message);
  }
});
