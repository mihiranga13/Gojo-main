
const settings = require('../settings')
const {cmd , commands} = require('../lib/command')
const os = require("os")
const fs                = require('fs')
const path              = require('path')
const saveSettings = () => {
  try {
    fs.writeFileSync(
      path.join(__dirname, '..', 'settings.json'),
      JSON.stringify(settingsStorage, null, 2)
    )
  } catch (e) {
    console.error('⚠️  Settings save error:', e)
  }
}
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
  pattern : 'settings',
  alias   : ['setting', 'st'],
  desc    : 'Show settings menu',
  category: 'owner',
  filename: __filename,
}, async (conn, mek, m, { from, isOwner, reply }) => {

  if (!isOwner) return reply('📛 *Only owner can use this command!*')

  const menu = `
*_⚙️ GOJO-MD SETTINGS ⚙️_*

🔢 *Reply with the number to change a setting*

\`\`\`
🌏 WORK_TYPE
1.1  PUBLIC      1.2  PRIVATE
1.3  GROUP_ONLY  1.4  INBOX_ONLY

👀 AUTO_STATUS_READ
2.1  ON   2.2  OFF

🎙 AUTO_VOICE
3.1  ON   3.2  OFF

💦 AUTO_MSG_READ
4.1  ON   4.2  OFF

⚡ AUTO_RECORDING
5.1  ON   5.2  OFF

🎯 AUTO_TYPING
6.1  ON   6.2  OFF

🍕 READ_ONLY_COMMANDS
7.1  ON   7.2  OFF

🚫 AUTO_BLOCK
8.1  ON   8.2  OFF

☎ ANTI_CALL
9.1  ON   9.2  OFF

✨ AUTO_REACT
10.1 ON   10.2 OFF

👾 AI_CHAT
11.1 ON   11.2 OFF

🚯 ANTI_DELETE
12.1 ON   12.2 OFF

🪀 ANTI_LINK
13.1 ON   13.2 OFF

🤖 ANTI_BOT
14.1 ON   14.2 OFF

💢 ANTI_BAD
15.1 ON   15.2 OFF
\`\`\`

_Example:_ *reply 8.1*  →  AUTO_BLOCK = ON
  `.trim()

  await conn.sendMessage(from, { text: menu }, { quoted: mek })

  // mark this user as “waiting for a settings code”
  global.__settingSession = global.__settingSession || {}
  global.__settingSession[mek.key.participant || from] = true
})

/* ------------------------------------------------- #2 reply handler */
cmd({
  // empty pattern – this will run for every non-command message
  only: 'text'
},
async (conn, mek, m, { body, from, sender, isOwner }) => {

  // we care only if this sender is in an active session
  if (!global.__settingSession?.[sender]) return

  // owner protection
  if (!isOwner) return

  delete global.__settingSession[sender]

  const code = body.trim()
  let updatedLabel = null

  const yes = true, no = false
  switch (code) {
    case '1.1': settingsStorage.MODE = 'public';        updatedLabel = '🌏 WORK_TYPE ➜ PUBLIC'; break
    case '1.2': settingsStorage.MODE = 'private';       updatedLabel = '🌏 WORK_TYPE ➜ PRIVATE'; break
    case '1.3': settingsStorage.MODE = 'group';         updatedLabel = '🌏 WORK_TYPE ➜ GROUP_ONLY'; break
    case '1.4': settingsStorage.MODE = 'inbox';         updatedLabel = '🌏 WORK_TYPE ➜ INBOX_ONLY'; break

    case '2.1': settingsStorage.AUTO_READ_STATUS  = yes; updatedLabel = '👀 AUTO_STATUS_READ ➜ ON';  break
    case '2.2': settingsStorage.AUTO_READ_STATUS  = no;  updatedLabel = '👀 AUTO_STATUS_READ ➜ OFF'; break

    case '3.1': settingsStorage.AUTO_VOICE        = yes; updatedLabel = '🎙 AUTO_VOICE ➜ ON';        break
    case '3.2': settingsStorage.AUTO_VOICE        = no;  updatedLabel = '🎙 AUTO_VOICE ➜ OFF';       break

    case '4.1': settingsStorage.READ_MESSAGE      = yes; updatedLabel = '💦 AUTO_MSG_READ ➜ ON';     break
    case '4.2': settingsStorage.READ_MESSAGE      = no;  updatedLabel = '💦 AUTO_MSG_READ ➜ OFF';    break

    case '5.1': settingsStorage.FAKE_RECORDING    = yes; updatedLabel = '⚡ AUTO_RECORDING ➜ ON';     break
    case '5.2': settingsStorage.FAKE_RECORDING    = no;  updatedLabel = '⚡ AUTO_RECORDING ➜ OFF';    break

    case '6.1': settingsStorage.AUTO_TYPING       = yes; updatedLabel = '🎯 AUTO_TYPING ➜ ON';       break
    case '6.2': settingsStorage.AUTO_TYPING       = no;  updatedLabel = '🎯 AUTO_TYPING ➜ OFF';      break

    case '7.1': settingsStorage.READ_ONLY_COMMANDS = yes; updatedLabel = '🍕 READ_ONLY_COMMANDS ➜ ON'; break
    case '7.2': settingsStorage.READ_ONLY_COMMANDS = no;  updatedLabel = '🍕 READ_ONLY_COMMANDS ➜ OFF'; break

    case '8.1': settingsStorage.AUTO_BLOCK        = yes; updatedLabel = '🚫 AUTO_BLOCK ➜ ON';        break
    case '8.2': settingsStorage.AUTO_BLOCK        = no;  updatedLabel = '🚫 AUTO_BLOCK ➜ OFF';       break

    case '9.1': settingsStorage.ANTI_CALL         = yes; updatedLabel = '☎ ANTI_CALL ➜ ON';         break
    case '9.2': settingsStorage.ANTI_CALL         = no;  updatedLabel = '☎ ANTI_CALL ➜ OFF';        break

    case '10.1': settingsStorage.AUTO_REACT       = yes; updatedLabel = '✨ AUTO_REACT ➜ ON';        break
    case '10.2': settingsStorage.AUTO_REACT       = no;  updatedLabel = '✨ AUTO_REACT ➜ OFF';       break

    case '11.1': settingsStorage.AI_CHAT          = yes; updatedLabel = '👾 AI_CHAT ➜ ON';          break
    case '11.2': settingsStorage.AI_CHAT          = no;  updatedLabel = '👾 AI_CHAT ➜ OFF';         break

    case '12.1': settingsStorage.ANTI_DELETE      = yes; updatedLabel = '🚯 ANTI_DELETE ➜ ON';      break
    case '12.2': settingsStorage.ANTI_DELETE      = no;  updatedLabel = '🚯 ANTI_DELETE ➜ OFF';     break

    case '13.1': settingsStorage.ANTI_LINK        = yes; updatedLabel = '🪀 ANTI_LINK ➜ ON';        break
    case '13.2': settingsStorage.ANTI_LINK        = no;  updatedLabel = '🪀 ANTI_LINK ➜ OFF';       break

    case '14.1': settingsStorage.ANTI_BOT         = yes; updatedLabel = '🤖 ANTI_BOT ➜ ON';         break
    case '14.2': settingsStorage.ANTI_BOT         = no;  updatedLabel = '🤖 ANTI_BOT ➜ OFF';        break

    case '15.1': settingsStorage.ANTI_BAD         = yes; updatedLabel = '💢 ANTI_BAD ➜ ON';         break
    case '15.2': settingsStorage.ANTI_BAD         = no;  updatedLabel = '💢 ANTI_BAD ➜ OFF';        break
  }

  if (!updatedLabel) {
    return conn.sendMessage(from, { text: '❌ Invalid code!  Type .settings again.' }, { quoted: mek })
  }

  saveSettings()
  await conn.sendMessage(from, { text: `*✅ ${updatedLabel}*` }, { quoted: mek })
})