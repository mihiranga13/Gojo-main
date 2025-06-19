const { fetchJson } = require("../lib/functions");
const { cmd } = require("../lib/command");
const axios = require("axios");

const apilink = 'https://www.dark-yasiya-api.site';

cmd({
    pattern: "xvdl",
    alias: ["xvdl", "xvdown"],
    react: "🔞",
    desc: "Download xvideo.com porn video",
    category: "download",
    use: '.xvdl <query>',
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply("❌ Please provide a search query!");

        const xvList = await fetchJson(`${apilink}/search/xvideo?q=${q}`);
        if (!xvList?.result?.length) return await reply("❌ No results found!");

        const xvData = await fetchJson(`${apilink}/download/xvideo?url=${xvList.result[0].url}`);
        const res = xvData.result;

        let info = `🔞 *𝙓𝙑𝙞𝙙𝙚𝙤 𝙎𝙚𝙭 𝘿𝙤𝙬𝙣𝙡𝙤𝙖𝙙𝙚𝙧* 🔞\n\n` +
            `📌 *Title:* ${res.title || "Unknown"}\n` +
            `👁 *Views:* ${res.views || "Unknown"}\n` +
            `👍 *Likes:* ${res.like || "Unknown"}\n` +
            `👎 *Dislikes:* ${res.deslike || "Unknown"}\n` +
            `📦 *Size:* ${res.size || "Unknown"}\n\n` +
            `🔽 *Reply with your choice:*\n` +
            `1️⃣ *Video File* 📹\n` +
            `2️⃣ *Document File* 📁\n\n` +
            `🔐 *Powered by sayura mihiranga*`;

        const sentMsg = await conn.sendMessage(from, { image: { url: res.image }, caption: info }, { quoted: mek });
        const messageID = sentMsg.key.id;
        await conn.sendMessage(from, { react: { text: '📥', key: sentMsg.key } });

        conn.ev.on('messages.upsert', async (msgUp) => {
            try {
                const msgInfo = msgUp?.messages?.[0];
                if (!msgInfo?.message) return;

                const userText = msgInfo.message?.conversation || msgInfo.message?.extendedTextMessage?.text;
                const isReplyToOurMsg = msgInfo.message?.extendedTextMessage?.contextInfo?.stanzaId === messageID;

                if (!isReplyToOurMsg) return;

                let userReply = userText.trim();

                if (userReply === "1") {
                    const sent = await conn.sendMessage(from, { text: "⏳ Downloading video..." }, { quoted: mek });
                    await conn.sendMessage(from, { video: { url: res.dl_link }, mimetype: "video/mp4", caption: res.title }, { quoted: mek });
                    await conn.sendMessage(from, { text: "✅ Video sent!\nPowered by Chamindu", edit: sent.key });
                } else if (userReply === "2") {
                    const sent = await conn.sendMessage(from, { text: "⏳ Uploading document..." }, { quoted: mek });
                    await conn.sendMessage(from, { document: { url: res.dl_link }, fileName: `${res.title}.mp4`, mimetype: "video/mp4", caption: res.title }, { quoted: mek });
                    await conn.sendMessage(from, { text: "✅ Document sent!\nPowered by Chamindu", edit: sent.key });
                } else {
                    await conn.sendMessage(from, { text: "❌ Invalid choice! Reply with 1 or 2", quoted: msgInfo });
                }

            } catch (err) {
                console.error(err);
                await reply(`❌ Error while handling reply: ${err.message}`);
            }
        });

    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        await reply(`❌ *An error occurred:* ${err.message}`);
    }
});
