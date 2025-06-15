const { cmd } = require("../lib/command");
const axios = require("axios");

let pastppInfoMap = {};
let pastppLastMsgKey = null;
let pastppConnRef = null;

// ─────────────────────────────────────────────────────────────
//  /pastpp  ➜  search past papers
// ─────────────────────────────────────────────────────────────
cmd(
  {
    pattern: "pastpp",
    alias: ["pastpaper", "pastpapers"],
    desc: "Search and download Sri Lanka school past papers!",
    react: "📄",
    category: "education",
    filename: __filename,
  },
  async (conn, mek, m, { from, args, reply }) => {
    try {
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

      // 1️⃣  search API
      const api = `https://api-pass.vercel.app/api/search?query=${encodeURIComponent(
        query
      )}&page=1`;
      const { data } = await axios.get(api);

      if (!Array.isArray(data.results) || data.results.length === 0) {
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
        return reply(
          "❌ *No past papers found for your search. Try another keyword!*"
        );
      }

      const results = data.results;

      // 2️⃣  build list-message payload
      const listMsg = {
        image: {
          url:
            results[0].thumbnail ||
            "https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png",
        },
        footer: "© GOJO MD | Past Paper Search",
        headerType: 4,
        contextInfo: {
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: { newsletterName: "👾 GOJO | MD ジ" },
          externalAdReply: {
            title: "GOJO MD | Auto AI",
            body: "Powered by Sayura | darkhackersl",
            thumbnailUrl:
              "https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png",
            mediaType: 1,
            sourceUrl: "https://github.com/darkhackersl",
            renderLargerThumbnail: true,
          },
        },
        text:
          "*📄 Past Paper Search Results*\n" +
          "━━━━━━━━━━━━━━━━━━\n" +
          "Select a paper to download:\n" +
          "━━━━━━━━━━━━━━━━━━\n" +
          "_Powered by @gojo md_",
        sections: [
          {
            title: "Search Results",
            rows: results.map((item, i) => ({
              title:
                item.title.length > 32
                  ? item.title.slice(0, 32) + "…"
                  : item.title,
              rowId: `.pastpplist_${i}`,
              description: item.description
                ? item.description.length > 45
                  ? item.description.slice(0, 45) + "…"
                  : item.description
                : "",
            })),
          },
        ],
        buttonText: "Select Past Paper",
      };

      // 3️⃣  send the list-message
      const sentMsg = await conn.sendMessage(from, listMsg, { quoted: mek });

      pastppLastMsgKey = sentMsg?.key?.id ?? null;
      if (pastppLastMsgKey) pastppInfoMap[pastppLastMsgKey] = results;

      await conn.sendMessage(from, {
        react: { text: "✅", key: sentMsg.key },
      });
    } catch (err) {
      console.error(err);
      await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
      reply("*ERROR ❗❗*");
    }
  }
);

// ─────────────────────────────────────────────────────────────
//  Handle list-reply ➜ download selected paper
// ─────────────────────────────────────────────────────────────
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

      const selected = listReply.singleSelectReply.selectedRowId?.trim();
      if (!selected?.startsWith(".pastpplist_")) return;

      const idx = Number(selected.replace(".pastpplist_", ""));
      const stanzaId = listReply.contextInfo?.stanzaId || pastppLastMsgKey;
      const results = stanzaId ? pastppInfoMap[stanzaId] : null;

      if (!results?.[idx]) {
        await pastppConnRef.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key },
        });
        return;
      }

      const info = results[idx];

      try {
        await pastppConnRef.sendMessage(msg.key.remoteJid, {
          react: { text: "⏬", key: msg.key },
        });

        const { data: dl } = await axios.get(
          `https://api-pass.vercel.app/api/download?url=${encodeURIComponent(
            info.url
          )}`
        );

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
            caption:
              `*📄 ${dl.download_info.file_title || info.title}*\n\n` +
              `Source: ${info.url}\n_Powered by gojo md_`,
          },
          { quoted: msg }
        );

        await pastppConnRef.sendMessage(msg.key.remoteJid, {
          react: { text: "✅", key: msg.key },
        });
      } catch (err) {
        console.error(err);
        await pastppConnRef.sendMessage(msg.key.remoteJid, {
          react: { text: "❌", key: msg.key },
        });
        await pastppConnRef.sendMessage(
          msg.key.remoteJid,
          { text: "❌ *Failed to fetch the download link!*" },
          { quoted: msg }
        );
      }
    });
  };

  waitForPastppConn(); // ⚙️ kick-start listener loop
}
