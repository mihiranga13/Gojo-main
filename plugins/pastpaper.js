const { cmd } = require("../lib/command");
const axios = require("axios");
const { getBuffer } = require("../lib/functions");

let pastppInfoMap = {};
let pastppLastMsgKey = null;
let pastppConnRef = null;

cmd({
  pattern: "pastpp",
  alias: ["pastpaper", "pastpapers"],
  desc: "Search and download Sri Lanka school past papers!",
  react: "📄",
  category: "education",
  filename: __filename,
}, async (conn, mek, m, { from, args, reply }) => {
  pastppConnRef = conn;

  const query = args.join(" ").trim();
  if (!query) {
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    return reply(
      "Type a past-paper name, grade or subject to search!\n" +
      "e.g. `.pastpp grade 11 science`"
    );
  }

  await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

  try {
    const apiUrl = `https://api-pass.vercel.app/api/search?query=${encodeURIComponent(query)}&page=1`;
    const { data } = await axios.get(apiUrl);

    if (!Array.isArray(data.results) || data.results.length === 0) {
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      return reply("❌ *No past papers found for your search. Try another keyword!*");
    }

    const results = data.results;

    // Build list message
    const listMsg = {
      text: "*📄 Past Paper Search Results*\n━━━━━━━━━━━━━━━━━━\nSelect a paper to download:\n━━━━━━━━━━━━━━━━━━",
      footer: "© GOJO MD | Past Paper Search",
      headerType: 1,
      sections: [{
        title: "Search Results",
        rows: results.map((item, i) => ({
          title: item.title.length > 32 ? item.title.slice(0, 32) + "…" : item.title,
          rowId: `.pastpplist_${i}`,
          description: item.description ? (item.description.length > 45 ? item.description.slice(0, 45) + "…" : item.description) : ""
        }))
      }],
      buttonText: "Select Past Paper",
    };

    const sentMsg = await conn.sendMessage(from, listMsg, { quoted: mek });

    pastppLastMsgKey = sentMsg?.key?.id ?? null;
    if (pastppLastMsgKey) pastppInfoMap[pastppLastMsgKey] = results;

    await conn.sendMessage(from, { react: { text: "✅", key: sentMsg.key } });
  } catch (error) {
    console.error(error);
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    reply("*ERROR ❗❗*");
  }
});

// List reply handler: download selected past paper
if (!global.__pastppListHandler) {
  global.__pastppListHandler = true;

  const { setTimeout } = require("timers");

  const waitForPastppConn = () => {
    if (!pastppConnRef) return setTimeout(waitForPastppConn, 500);

    pastppConnRef.ev.on("messages.upsert", async ({ messages = [] }) => {
      const msg = messages[0];
      if (!msg?.key) return;

      const listReply = msg.message?.listResponseMessage;
      if (!listReply) return;

      const selected = listReply.singleSelectReply?.selectedRowId?.trim();
      if (!selected || !selected.startsWith(".pastpplist_")) return;

      const idx = Number(selected.replace(".pastpplist_", ""));
      const stanzaId = listReply.contextInfo?.stanzaId || pastppLastMsgKey;
      const results = stanzaId ? pastppInfoMap[stanzaId] : null;

      if (!results?.[idx]) {
        await pastppConnRef.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key }
        });
        return;
      }

      const info = results[idx];

      try {
        await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⏬", key: msg.key } });

        const dlRes = await axios.get(`https://api-pass.vercel.app/api/download?url=${encodeURIComponent(info.url)}`);
        const dl = dlRes.data;

        if (!dl?.download_info?.download_url) {
          await pastppConnRef.sendMessage(
            msg.key.remoteJid,
            { text: "❌ *Download link not found!*" },
            { quoted: msg }
          );
          return;
        }

        await pastppConnRef.sendMessage(
          msg.key.remoteJid,
          {
            document: { url: dl.download_info.download_url },
            mimetype: "application/pdf",
            fileName: dl.download_info.file_name || "pastpaper.pdf",
            caption: `*📄 ${dl.download_info.file_title || info.title}*\n\nSource: ${info.url}\n_Powered by GOJO MD_`
          },
          { quoted: msg }
        );

        await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key } });
      } catch (e) {
        console.error(e);
        await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key } });
        await pastppConnRef.sendMessage(
          msg.key.remoteJid,
          { text: "❌ *Failed to fetch the download link!*" },
          { quoted: msg }
        );
      }
    });
  };

  waitForPastppConn();
}
