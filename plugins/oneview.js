const l = console.log;
const { cmd } = require("../lib/command");

cmd({
  pattern: "vv",
  alias: ["viewonce", "retrieve"],
  react: "🐳",
  desc: "Owner Only - view once message එක නැවත ලබා ගන්න",
  category: "owner",
  filename: __filename,
}, async (client, m, text, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return client.sendMessage(from, {
        text: "*📛 මේක owner ට විතරයි.*"
      }, { quoted: m });
    }

    const quoted = m.quoted;

    if (!quoted || !quoted.message || !quoted.message.viewOnceMessage || !quoted.message.viewOnceMessage.message) {
      return client.sendMessage(from, {
        text: "*🍁 කරුණාකර view once message එකකට reply කරන්න.*"
      }, { quoted: m });
    }

    const viewOnceMsg = quoted.message.viewOnceMessage.message;
    const type = Object.keys(viewOnceMsg)[0];
    const buffer = await client.downloadMediaMessage({ message: viewOnceMsg });

    let msg = {};

    if (type === "imageMessage") {
      msg.image = buffer;
      msg.caption = viewOnceMsg.imageMessage.caption || '';
    } else if (type === "videoMessage") {
      msg.video = buffer;
      msg.caption = viewOnceMsg.videoMessage.caption || '';
    } else {
      return client.sendMessage(from, {
        text: "❌ View Once message එකේ image/ video විතරයි support වෙන්නෙ."
      }, { quoted: m });
    }

    await client.sendMessage(from, msg, { quoted: m });

  } catch (err) {
    console.error("vv error:", err);
    await client.sendMessage(from, {
      text: "❌ Error: " + err.message
    }, { quoted: m });
  }
});
