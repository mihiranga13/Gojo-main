const { cmd } = require("../lib/command");

cmd({
  pattern: "vv",
  alias: ["viewonce", "retrieve"],
  react: "🐳",
  desc: "Owner Only - view once message එක නැවත ලබා ගන්න",
  category: "owner",
  filename: __filename,
}, async (client, message, match, { from, isCreator }) => {
  try {
    if (!isCreator) {
      return client.sendMessage(from, {
        text: "*📛 මේක owner ට විතරයි.*"
      }, { quoted: message });
    }

    const quoted = message.quoted;
    if (!quoted || !quoted.mtype) {
      return client.sendMessage(from, {
        text: "*🍁 කරුණාකර view once message එකකට reply කරන්න.*"
      }, { quoted: message });
    }

    const buffer = await quoted.download();
    const mtype = quoted.mtype;
    const options = { quoted: message };

    let content = {};
    switch (mtype) {
      case "imageMessage":
        content = {
          image: buffer,
          caption: quoted.text || '',
        };
        break;
      case "videoMessage":
        content = {
          video: buffer,
          caption: quoted.text || '',
        };
        break;
      case "audioMessage":
        content = {
          audio: buffer,
          mimetype: "audio/mp4",
          ptt: quoted.ptt || false
        };
        break;
      default:
        return client.sendMessage(from, {
          text: "❌ image, video, audio විතරක් පමණයි මෙතැන support වෙන්නෙ."
        }, { quoted: message });
    }

    await client.sendMessage(from, content, options);

  } catch (err) {
    console.error("vv Error:", err);
    await client.sendMessage(from, {
      text: "❌ view once message එක ලබාගැනීමේදී දෝෂයක්:\n" + err.message
    }, { quoted: message });
  }
});
