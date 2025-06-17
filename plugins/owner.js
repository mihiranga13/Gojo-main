
const config = require('../settings')
const {cmd , commands} = require('../lib/command')
const os = require("os")
const {runtime} = require('../lib/functions')

cmd({
    pattern: "system",
    alias: ["about","bot"],
    desc: "Check bot online or no.",
    category: "main",
    react: "📟",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

    let status = `
───────────────────
_*⚙️ ☣️Gojo Ｓｙｓｔｅｍ  Ｉｎｆｏ ⚙️*_
───────────────────

┌────────────────
│❖ *ᴜᴘᴛɪᴍᴇ :* _${runtime(process.uptime())}_
│❖ *ʀᴀᴍ ᴜꜱᴀɢᴇ :*  _${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(require('os').totalmem / 1024 / 1024)}MB_
│❖ *ʜᴏꜱᴛ ɴᴀᴍᴇ :* _${os.hostname()}_
│❖ *ᴏᴡɴᴇʀ :* _Sayura mihiranga_
└────────────────

> *ᴄʀᴇᴀᴛᴇᴅ ʙʏ ꜱayura mihiranga*    
`
await conn.sendMessage(from,{image: {url: `https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png`},caption: status,
contextInfo: {
                mentionedJid: ['94743826406@s.whatsapp.net'], // specify mentioned JID(s) if any
                groupMentions: [],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    
                    newsletterName: "Gojo-ᴍᴅ ✻",
                    serverMessageId: 999
                }            
            }
     }, {quoted: mek});
    
}catch(e){
    console.log(e)
    reply(`${e}`)
    }
    })


//__________ping______

cmd({
    pattern: "ping2",
    desc: "Check bot online or no.",
    category: "main",
    react: "🚀",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    const startTime = Date.now()
        const message = await conn.sendMessage(from, { text: '*pong...*' })
        const endTime = Date.now()
        const ping = endTime - startTime
        await conn.sendMessage(from, { text: `*⚬Gojo-ᴍᴅ ꜱᴘᴇᴇᴅ : ${ping}ms*`,
                                      contextInfo: {
                mentionedJid: ['94743826406@s.whatsapp.net'], // specify mentioned JID(s) if any
                groupMentions: [],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    
                    newsletterName: "Gojo-ᴍᴅ ✻",
                    serverMessageId: 999
                },
                externalAdReply: {
                    title: 'GOJO MD',
                    body: 'ꜱayura mihiranga',
                    mediaType: 1,
                    
                    thumbnailUrl: 'https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png', // This should match the image URL provided above
                    renderLargerThumbnail: false,
                    showAdAttribution: true
                }
            }
     }, {quoted: mek});
    } catch (e) {
        console.log(e)
        reply(`${e}`)
    }
})

//Owner
cmd({
    pattern: "owner",
    desc: "cmd",
    category: "system",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
let cap = `
┏━┫ *⚬Gojo-ᴍᴅ⚬* ┣━✾
┃
┣━━━━━━━━━━━━━━━
- *Sayura* 💀⃤
        94743826406
╰━━━━━━━━━━━━━━━
> Gojo-ᴍᴅ
`
return await conn.sendMessage(from,{image: {url: `https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png`},caption: cap,
                                    contextInfo: {
                mentionedJid: ['94743826406@s.whatsapp.net'], // specify mentioned JID(s) if any
                groupMentions: [],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    
                    newsletterName: "Gojo-ᴍᴅ ✻",
                    serverMessageId: 999
                },
                externalAdReply: {
                    title: 'GOJO MD',
                    body: 'sayura mhiriranga',
                    mediaType: 1,
                    
                    thumbnailUrl: 'https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png', // This should match the image URL provided above
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
     }, {quoted: mek});
}catch(e){
console.log(e)
reply(`${e}`)
}
})
//______________restart_____________

cmd({
    pattern: "restart",
    alias: ["update","up"],
    react: "☣️",
    desc: "restart the bot",
    category: "owner",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
const {exec} = require("child_process")
reply("*restarting...*")
exec("pm2 restart all")
}catch(e){
console.log(e)
reply(`${e}`)
}
})

//________Settings_________

cmd({
    pattern: "settings",
    alias: ["setting","st"],
    desc: "restart the bot",
    category: "owner",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
let cap = `
┏━┫ *Gojo-ᴍᴅ-ꜱᴇᴛᴛɪɴɢꜱ⚬* ┣━✾
┃            *Gojo  ✻  Md*
┻
*ᴘʀᴇꜰɪx ➭* _${settings.PREFIX}_
*ᴍᴏᴅᴇ ➭* _${settings.MODE}_
*ᴠᴏɪᴄᴇ_ʀᴇᴘʟʏ ➭* _${settings.AUTO_VOICE}_
*ᴀᴜᴛᴏ_ꜱᴛɪᴄᴋᴇʀ ➭* _${settings.AUTO_STICKER}_
*ᴀᴜᴛᴏ_ʀᴇᴀᴅ_ꜱᴛᴀᴛᴜꜱ ➭* _${settings.AUTO_READ_STATUS}_
*ᴀᴜᴛᴏ_ꜱᴛᴀᴛᴜꜱ_ʀᴇᴀᴄᴛ ➭* _${settings.AUTO_STATUS_REACT}_
*ᴀᴜᴛᴏ_ꜱᴛᴀᴛᴜꜱ_ʀᴇᴘʟʏ ➭* _${settings.AUTO_STATUS_REPLY}_
*ꜱᴛᴀᴛᴜꜱ_ʀᴇᴘʟʏ_ᴍꜱɢ ➭ ${settings.STATUS_REPLY_MSG}
*ᴀᴜᴛᴏ_ʀᴇᴀᴄᴛ ➭* _${settings.AUTO_REACT}_
*ᴀᴜᴛᴏ_ʀᴇᴀᴅ_ᴍꜱɢ ➭* _${settings.READ_MESSAGE}_
*ꜰᴀᴋᴇ_ʀᴇᴄᴏʀᴅɪɴɢ ➭* _${settings.FAKE_RECORDING}_
*ᴀᴜᴛᴏ_ᴛʏᴘɪɴɢ ➭* _${settings.AUTO_TYPING}_
*ᴀɴᴛɪ_ʙᴀᴅ_ᴡᴏʀᴅ ➭* _${settings.ANTI_BAD}_
*ᴀɴᴛɪ_ʟɪɴᴋ ➭* _${settings.ANTI_LINK}_
*ᴀɴᴛɪ_ᴅᴇʟᴇᴛᴇ ➭* _${settings.ANTI_DELETE}_
*ᴀɴᴛɪ_ᴄᴀʟʟ ➭* _${settings.ANTI_CALL}_
*ɪɴʙᴏx_ʙʟᴏᴄᴋ ➭* _${settings.INBOX_BLOCK}_
*ᴀʟᴡᴀʏꜱ_ᴏɴʟɪɴᴇ ➭* _${settings.ALWAYS_ONLINE}_

type *${settings.PREFIX}set* command\nsee how to change your settings

> Gojo-ᴍᴅ ✻
`

await conn.sendMessage(from,{image: {url: `https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png`},caption: cap,
contextInfo: {
                mentionedJid: ['94743826406@s.whatsapp.net'], // specify mentioned JID(s) if any
                groupMentions: [],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    
                    newsletterName: "Gojo-ᴍᴅ ✻",
                    serverMessageId: 999
                }            
            }
     }, {quoted: mek});
     
}catch(e){
console.log(e)
reply(`${e}`)
}
})

//SET
cmd({
    pattern: "set",
    alias: ["var","allvar"],
    desc: "restart the bot",
    category: "owner",
    filename: __filename
},
async(conn, mek, m,{from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{

    if (!isOwner) return reply("*📛 ᴏɴʟʏ ᴛʜᴇ ᴏᴡɴᴇʀ ᴄᴀɴ ᴜsᴇ ᴛʜɪs ᴄᴏᴍᴍᴀɴᴅ!*");
let cap = `
┏━┫ *⚬Gojo-ᴍᴅ-ꜱᴇᴛᴛɪɴɢꜱ⚬* ┣━✾
┃            *Gojo  ✻  Md*
┻
╭━━━━━━━━━━━━━━━
*ᴘʀᴇꜰɪx ➭* _${settings.PREFIX}_
* _${settings.PREFIX}prefix \ ? ,_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴍᴏᴅᴇ ➭* _${settings.MODE}_
* _${settings.PREFIX}mode public_
* _${settings.PREFIX}mode private_
* _${settings.PREFIX}mode group_
* _${settings.PREFIX}mode inbox_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴠᴏɪᴄᴇ_ʀᴇᴘʟʏ ➭* _${settings.AUTO_VOICE}_
* _${settings.PREFIX}
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ʀᴇᴘʟʏ ➭* _${settings.AUTO_REPLY}_
* _${settings.PREFIX}autoreply on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ꜱᴛɪᴄᴋᴇʀ ➭* _${settings.AUTO_STICKER}_
* _${settings.PREFIX}autosticker on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ʀᴇᴀᴅ_ꜱᴛᴀᴛᴜꜱ ➭* _${settings.AUTO_READ_STATUS}_
* _${settings.PREFIX}autoreadstatus on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ꜱᴛᴀᴛᴜꜱ_ʀᴇᴀᴄᴛ ➭* _${settings.AUTO_STATUS_REACT}_
* _${settings.PREFIX}statusreact on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ꜱᴛᴀᴛᴜꜱ_ʀᴇᴘʟʏ ➭* _${settings.AUTO_STATUS_REPLY}_
* _${settings.PREFIX}statusreply on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ꜱᴛᴀᴛᴜꜱ_ʀᴇᴘʟʏ_ᴍꜱɢ ➭ _random_
* _can't change this_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ʀᴇᴀᴄᴛ ➭* _${settings.AUTO_REACT}_
* _${settings.PREFIX}autoreact on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ʀᴇᴀᴅ_ᴍꜱɢ ➭* _${settings.READ_MESSAGE}_
* _${settings.PREFIX}readmessage on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ꜰᴀᴋᴇ_ʀᴇᴄᴏʀᴅɪɴɢ ➭* _${FAKE_RECORDING}_
* _${settings.PREFIX}fakerecrding on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀᴜᴛᴏ_ᴛʏᴘɪɴɢ ➭* _${settings.AUTO_TYPING}_
* _${settings.PREFIX}autotyping on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀɴᴛɪ_ʙᴀᴅ_ᴡᴏʀᴅ ➭* _${settings.ANTI_BAD}_
* _${settings.PREFIX}antibad on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀɴᴛɪ_ʙᴏᴛ ➭* _default_
* _${settings.PREFIX}antibot off_
* _${settings.PREFIX}antibot warn_
* _${settings.PREFIX}antibot delete_
* _${settings.PREFIX}antibot kick_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀɴᴛɪ_ʟɪɴᴋ ➭* _${settings.ANTI_LINK}_
* _${settings.PREFIX}antilink on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀɴᴛɪ_ʟɪɴᴋ 1 ➭* _default_
* _${settings.PREFIX}antilink1 off_
* _${settings.PREFIX}antilink1 warn_
* _${settings.PREFIX}antilink1 delete_
* _${settings.PREFIX}antilink1 kick_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀɴᴛɪ_ᴅᴇʟᴇᴛᴇ ➭* _${settings.ANTI_DELETE}_
* _${settings.PREFIX}antidel on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀɴᴛɪ_ᴄᴀʟʟ ➭* _${settings.ANTI_CALL}_
* _${settings.PREFIX}anticall on/off
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ɪɴʙᴏx_ʙʟᴏᴄᴋ ➭* _${settings.INBOX_BLOCK}_
* _${settings.PREFIX}inboxblock on/off_
╰━━━━━━━━━━━━━━━
╭━━━━━━━━━━━━━━━
*ᴀʟᴡᴀʏꜱ_ᴏɴʟɪɴᴇ ➭* _${config.ALWAYS_ONLINE}_
* _${settings.PREFIX}alwaysonline on/off_
╰━━━━━━━━━━━━━━━

> Gojo-ᴍᴅ ✻
`

await conn.sendMessage(from,{image: {url: `https://raw.githubusercontent.com/gojo18888/Photo-video-/refs/heads/main/file_000000003a2861fd8da00091a32a065a.png`},caption: cap,
contextInfo: {
                mentionedJid: ['94743826406@s.whatsapp.net'], // specify mentioned JID(s) if any
                groupMentions: [],
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    
                    newsletterName: "Gojo-ᴍᴅ ✻",
                    serverMessageId: 999
                }            
            }
     }, {quoted: mek});
     
}catch(e){
console.log(e)
reply(`${e}`)
}
})
