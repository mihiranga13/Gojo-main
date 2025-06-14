const { cmd } = require("../lib/command");

cmd({
  pattern : "vv",
  alias   : ["viewonce", "retrieve"],
  react   : "🐳",
  desc    : "Owner-only | Retrieve View-Once media (image / video / audio)",
  category: "owner",
  filename: __filename
}, async (Void, m, text, { from, isCreator }) => {
  try {
    /* 0️⃣ Owner check */
    if (!isCreator)
      return Void.sendMessage(from, { text: "📛 මේක owner ට විතරයි." }, { quoted: m });

    /* 1️⃣ Helper – return unified VO object */
    const extractVO = (msg) => {
      // Case-A: Baileys flag (easiest)
      if (msg.quoted?.isViewOnce) return msg.quoted;

      // Case-B: v2 structure (quotedMessage.viewOnceMessageV2)
      let voRaw = msg.msg?.contextInfo?.quotedMessage?.viewOnceMessageV2;
      if (voRaw) {
        const tp = Object.keys(voRaw.message)[0];
        return {
          mtype : tp,
          caption : voRaw.message[tp].caption || "",
          download : () => Void.downloadAndSaveMediaMessage(voRaw.message[tp])
        };
      }

      // Case-C: v1 structure (quotedMessage.viewOnceMessage)
      voRaw = msg.msg?.contextInfo?.quotedMessage?.viewOnceMessage;
      if (voRaw) {
        const tp = Object.keys(voRaw.message)[0];
        return {
          mtype : tp,
          caption : voRaw.message[tp].caption || "",
          download : () => Void.downloadAndSaveMediaMessage(voRaw.message[tp])
        };
      }

      return null;
    };

    const vo = extractVO(m);
    if (!vo) return Void.sendMessage(from,
      { text: "🍁 කරුණාකර *View-Once* පණිවිඩයකට reply කරන්න." }, { quoted: m });

    /* 2️⃣ Download & resend */
    const file = await vo.download();
    let out    = {};

    switch (vo.mtype) {
      case "imageMessage":
        out = { image: { url: file }, caption: vo.caption };
        break;
      case "videoMessage":
        out = { video: { url: file }, caption: vo.caption };
        break;
      case "audioMessage":
        out = { audio: { url: file }, mimetype: "audio/mp4", ptt: false };
        break;
      default:
        return Void.sendMessage(from,
          { text: "❌ Image / Video / Audio විතරක් පමණයි support." }, { quoted: m });
    }

    await Void.sendMessage(from, out, { quoted: m });
    await Void.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (err) {
    console.error("vv error →", err);
    Void.sendMessage(from,
      { text: "❌ දෝෂයක්: " + err.message }, { quoted: m });
  }
});