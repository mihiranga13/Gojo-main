const { cmd } = require('../lib/command');
const axios = require('axios');

// Store search results per chat for list reply
let pastppInfoMap = {};
let pastppLastMsgKey = null;
let pastppConnRef = null;

cmd({
    pattern: "pastpp",
    alias: ["pastpaper", "pastpapers"],
    desc: "Search and download Sri Lanka school past papers!",
    react: "📄",
    category: "education",
    filename: __filename
}, async (conn, mek, m, { from, args, reply }) => {
    try {
        pastppConnRef = conn;
        const query = args.join(" ");
        if (!query) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
            return reply('Type a past paper name, grade or subject to search!\nEx: `.pastpp grade 11 science`');
        }

        await conn.sendMessage(from, { react: { text: "🔍", key: mek.key } });

        // 1. Search Past Papers
        const searchUrl = `https://api-pass.vercel.app/api/search?query=${encodeURIComponent(query)}&page=1`;
        const { data } = await axios.get(searchUrl);

        if (!Array.isArray(data.results) || data.results.length === 0) {
            await conn.sendMessage(from, { react: { text: "❌", key: mek.key }});
            return reply("❌ *No past papers found for your search. Try another keyword!*");
        }

        const results = data.results;
        let sendObj = {
            image: { url: results[0].thumbnail || "https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png" },
            footer: "© GOJO MD | Past Paper Search",
            headerType: 4,
         contextInfo: {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterName: "👾 GOJO  |   MD ジ",
                   
                },
                externalAdReply: {
                    title: "GOJOMD| Auto AI",
                    body: "Powered by sayura| darkhackersl",
                    thumbnailUrl: 'https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png',
                    image: 'https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png',
                    mediaType: 1,
                    sourceUrl: 'https://github.com/darkhackersl',
                    renderLargerThumbnail: true
                }
            }


                /*mentionedJid: [m.sender],
                stanzaId: mek.key.id*/
            }
        

        // Build rows for list
        const rows = results.map((item, i) => ({
            title: item.title.length > 32 ? item.title.substring(0, 32) + "..." : item.title,
            rowId: `.pastpplist_${i}`,
            description: item.description ? (item.description.length > 45 ? item.description.substring(0, 45) + "..." : item.description) : ""
        }));

        sendObj.text = `*📄 Past Paper Search Results*\n━━━━━━━━━━━━━━━━━━\nSelect a paper to download:\n━━━━━━━━━━━━━━━━━━\n_Powered by @gojo md_`;
        sendObj.sections = [
            {
                title: "Search Results",
                rows: rows
            }
        ];
        sendObj.buttonText = "Select Past Paper";

        // Send as list message
        const sentMsg = await conn.sendMessage(from, sendObj, { quoted: mek });

        pastppLastMsgKey = sentMsg?.key?.id ?? null;
        if (pastppLastMsgKey) pastppInfoMap[pastppLastMsgKey] = results;

        await conn.sendMessage(from, { react: { text: "✅", key: sentMsg.key }});
    } catch (e) {
        console.log(e);
        await pastppConnRef.sendMessage(from, { react: { text: "❌", key: mek.key }});
        reply("*ERROR ❗❗*");
    }
});

// List reply handler for past paper download
if (!global.__pastppListHandler) {
    global.__pastppListHandler = true;
    const { setTimeout } = require('timers');
    function waitForPastppConn() {
        if (!pastppConnRef) return setTimeout(waitForPastppConn, 500);
        pastppConnRef.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages?.[0];
            if (!msg || !msg.key) return;

            // List reply mode
            if (msg.message && msg.message.listResponseMessage) {
                const selected = msg.message.listResponseMessage.singleSelectReply.selectedRowId?.trim();
                if (!selected || !selected.startsWith('.pastpplist_')) return;

                const idx = parseInt(selected.replace('.pastpplist_', ''));
                const stanzaId = msg.message.listResponseMessage.contextInfo?.stanzaId || pastppLastMsgKey;
                const results = stanzaId && pastppInfoMap[stanzaId] ? pastppInfoMap[stanzaId] : null;
                if (!results || !results[idx]) {
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key }});
                    return;
                }

                const info = results[idx];
                // Download API call
                try {
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "⏬", key: msg.key }});
                    const { data: dl } = await axios.get(`https://api-pass.vercel.app/api/download?url=${encodeURIComponent(info.url)}`);
                    if (!dl?.download_info?.download_url) {
                        await pastppConnRef.sendMessage(msg.key.remoteJid, { text: "❌ *Download link not found!*" }, { quoted: msg });
                        return;
                    }
                    await pastppConnRef.sendMessage(msg.key.remoteJid, {
                        document: { url: dl.download_info.download_url },
                        mimetype: 'application/pdf',
                        fileName: dl.download_info.file_name || 'pastpaper.pdf',
                        caption: `*📄 ${dl.download_info.file_title || info.title}*\n\nSource: ${info.url}\n_Powered by gojo md_`
                    }, { quoted: msg });
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "✅", key: msg.key }});
                } catch (e) {
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { react: { text: "❌", key: msg.key }});
                    await pastppConnRef.sendMessage(msg.key.remoteJid, { text: "❌ *Failed to fetch the download link!*" }, { quoted: msg });
                }
            }
        });
    }
    waitForPastppConn();
