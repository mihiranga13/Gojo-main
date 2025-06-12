const l = console.log;
const config = require('../settings');
const { cmd, commands } = require('../lib/command');
const axios = require("axios");

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Google Drive Downloader with size limit (e.g., 1024MB)
const MAX_DOWNLOAD_SIZE = 1024 * 1024 * 1024;

cmd({
    pattern: "gdrive",
    alias: ["googledrive"],
    react: '🎗️',
    desc: "Download Google Drive files",
    category: "download",
    filename: __filename
}, async (conn, mek, m, { from, q, pushname }) => {
    if (!q || !q.startsWith("https://")) {
        return conn.sendMessage(from, { text: "𝖯𝗅𝖾𝖺𝗌𝖾 𝖦𝗂𝗏𝖾 𝖬𝖾 𝖯𝗋𝗈𝗏𝗂𝖽𝖾 `𝖦𝖽𝗋𝗂𝗏𝖾 𝖴𝗋𝗅` ❗" }, { quoted: mek });
    }

    try {
        const baseUrl = 'https://api.gdriveapi.xyz'; // 👈 Adjust if needed
        const data = await axios.get(`${baseUrl}/api/gdrivedl?url=${encodeURIComponent(q)}`);
        const fileInfo = data.data.data || data.data;

        await conn.sendMessage(
            from,
            {
                text: `*乂 GOJO-MD GDRIVE DOWNLOADER*

📁 𝖭𝖺𝗆𝖾 : ${fileInfo.fileName}
📻 𝖥𝗂𝗅𝖾 𝖲𝗂𝗓𝖾 : ${fileInfo.fileSize}
🖇️ 𝖡𝖺𝗌𝖾 𝖴𝗋𝗅 : www.gdrive.com

> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ꜱayura mihiranga*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: `GOJO-MD Gdrive Downloader`,
                        body: `${fileInfo.fileName || fileInfo.title || `Undefined`} : Powered By Sayura Gdrive Engine`,
                        thumbnailUrl: `https://raw.githubusercontent.com/sayura19/Helper/refs/heads/main/file_00000000d0dc61f597f450261ecfe33f%20(1).png`,
                        sourceUrl: `https://www.google.com`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            },
            { quoted: mek }
        );

        const fileSizeBytes = fileInfo.fileSizeInBytes || fileInfo.fileSize || 0;

        if (fileSizeBytes > MAX_DOWNLOAD_SIZE) {
            await conn.sendMessage(from, {
                text: `⚠️ File is too large. Maximum allowed size is 1024 MB. This file is ${formatFileSize(fileSizeBytes)}.`,
            }, { quoted: mek });
            return await conn.sendMessage(from, { react: { text: "⚠️", key: mek.key } });
        }

        await conn.sendMessage(from, {
            document: { url: fileInfo.download || fileInfo.link || fileInfo.url },
            fileName: fileInfo.fileName || fileInfo.title,
            mimetype: fileInfo.mimeType || fileInfo.file_type,
            caption: `> *©ᴘᴏᴡᴇʀᴇᴅ ʙʏ ꜱayura tech*`
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

    } catch (error) {
        console.error('❌ Error in Google Drive downloader:', error);
        const errorMessage = error.response && error.response.status === 404
            ? '❌ Error: File not found. Check the URL and try again.'
            : `❌ Error: ${error.message}`;

        await conn.sendMessage(from, { text: errorMessage }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});
