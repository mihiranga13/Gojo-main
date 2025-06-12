const config = require('../settings')
const { cmd, commands } = require('../lib/command')
const imageUrl = 'https://raw.githubusercontent.com/gojosathory1/My-helper/refs/heads/main/file_00000000d0dc61f597f450261ecfe33f%20(1).png';

cmd({
    pattern: "menu",
    react: "📜",
    alias: ["panel", "commands"],
    desc: "Get Bot Menu",
    category: "main",
    use: '.menu',
    filename: __filename
}, async (conn, mek, m, { from, pushname, reply }) => {
    try {
        const selectionMessage = `
╭━━━━∙⋆⋅⋆∙━ ─┉─ • ─┉─⊷
      𝐇ɪɪɪɪɪ......🍷 *${pushname}*
     *𝐆𝐎𝐉𝐎 𝐌ᴅ 𝐂ᴏᴍᴍᴀɴᴅ 𝐋ɪꜱᴛ*
╰━━━━∙⋆⋅⋆∙━ ─┉─ • ─┉─⊷

*╭────────────●●►*
*│𝐋ɪꜱᴛ  𝐌ᴇɴᴜ......☘️*
*│⟻⟻⟻⟻⟻⟻⟻*
*│1. 𝐃ᴏᴡɴʟᴏᴀᴅ 𝐌ᴇɴᴜ  📥* 
*│2. 𝐒ᴇᴀʀᴄʜ 𝐌ᴇɴᴜ 🔎* 
*│3. 𝐀ɪ 𝐌ᴇɴᴜ 🧠*
*│4. 𝐎ᴡɴᴇʀ 𝐌ᴇɴᴜ 👨‍💻*
*│5. 𝐆ʀᴏᴜᴘ 𝐌ᴇɴᴜ 👥*
*│6. 𝐈ɴꜰᴏ 𝐌ᴇɴᴜ 💾*
*│7. 𝐂ᴏɴᴠᴇʀᴛᴇʀ 𝐌ᴇɴᴜ 🔄*
*│8. 𝐑ᴀɴᴅᴏᴍ  𝐌ᴇɴᴜ ⛱️*
*│9. 𝐖ᴀʟʟᴘᴀᴘᴇʀꜱ  𝐌ᴇɴᴜ 🏜️*
*│10. 𝐎ᴛʜᴇʀ 𝐌ᴇɴᴜ 🌐*
*│11. 𝐀𝚞𝚝𝚘 𝐌ᴇɴᴜ 📌*
*╰────────────●●►*
𝐑ᴇᴘʟʏ 𝐓ʜᴇ 𝐍ᴜᴍʙᴇʀ 𝐘ᴏᴜ 𝐖ᴀɴᴛ 𝐓ᴏ 𝐒ᴇʟᴇᴄᴛ.......👁️❗
`;

        // Video preview send karanawa
        await conn.sendMessage(from, {
            video: {
                url: 'https://github.com/sulamadara1147/data/blob/main/VID-20250415-WA0268.mp4?raw=true'
            },
            mimetype: 'video/mp4',
            ptv: true
        }, { quoted: mek });

        // Image + Menu caption send karanawa
        const sentMsg = await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: selectionMessage,
            contextInfo: { forwardingScore: 999, isForwarded: true },
        }, { quoted: mek });

        // User response handler
        conn.ev.on('messages.upsert', async (msgUpdate) => {
            const msg = msgUpdate.messages[0];
            if (!msg.message || !msg.message.extendedTextMessage) return;

            const userResponse = msg.message.extendedTextMessage.text.trim();

            // Check if the response is in reply to the menu message
            if (msg.message.extendedTextMessage.contextInfo &&
                msg.message.extendedTextMessage.contextInfo.stanzaId === sentMsg.key.id) {

                let responseText;

                switch (userResponse) {
                    case '1': 
                        responseText = `*Download Menu*\n- song\n- video\n- apk\n...`;
                        break;
                    case '2':
                        responseText = `*Search Menu*\n- movie\n- news\n...`;
                        break;
                    case '3':
                        responseText = `*AI Menu*\n- ai\n- openai\n...`;
                        break;
                    case '4':
                        responseText = `*Owner Menu*\n- vv\n- shutdown\n...`;
                        break;
                    case '5':
                        responseText = `*Group Menu*\n- mute\n- unmute\n...`;
                        break;
                    case '6':
                        responseText = `*Info Menu*\n- alive\n- ping\n...`;
                        break;
                    default:
                        responseText = `Please reply with a valid menu number.`;
                }

                await conn.sendMessage(from, { text: responseText }, { quoted: mek });
            }
        });

    } catch (error) {
        console.error(error);
        reply('Sorry, an error occurred while loading the menu.');
    }
});
