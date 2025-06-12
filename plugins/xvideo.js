// plugins/xvideo.js
const l = console.log

import config from '../settings.js'
import { cmd, commands } from '../lib/command.js'
import { xvideosSearch, xvideosdl } from '../lib/ascraper.js'

cmd(
  {
    pattern: "xvid",
    alias: ["xvideos"],
    react: "🔞",
    desc: "Search and download Xvideos videos",
    category: "nsfw",
    filename: import.meta.url, // ✅ ESM equivalent to __filename
    group: true,
    premium: false,
    register: true,
  },
  async (robin, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, reply }) => {
    try {
      if (!q) {
        return reply(`✳️ What do you want to search?\n\nUsage: *${command} <search or URL>*\nExample: Hot desi bhabi or Xvideos URL`);
      }

      // 💡 Ensure global DB structure exists
      if (!global.db) global.db = { data: { chats: {}, users: {} } }
      if (!global.db.data) global.db.data = { chats: {}, users: {} }
      if (!global.db.data.chats) global.db.data.chats = {}
      if (!global.db.data.users) global.db.data.users = {}

      const chat = global.db.data.chats[m.chat] || {}
      const user = global.db.data.users[m.sender] || {}

      // ❌ NSFW group restriction
      if (!chat.nsfw) {
        return reply(`🚫 This group does not support NSFW content.\nTo turn it on, use: *${command} enable nsfw*`);
      }

      // ❌ Age restriction
      const userAge = user.age || 0
      if (userAge < 18) {
        return reply(`❎ You must be 18 years or older to use this feature.`);
      }

      m.react('⌛')

      const isURL = /^(https?:\/\/)?(www\.)?xvideos\.com\/.+$/i.test(q)

      if (isURL) {
        const videoLinks = await xvideosdl(q)
        const videoUrl = videoLinks?.high || videoLinks?.low || videoLinks?.hls

        if (!videoUrl) return reply("❌ Video URL not found.")

        await robin.sendMessage(from, {
          video: { url: videoUrl },
          caption: "🔞 Here is your Xvideos video."
        }, { quoted: mek })

      } else {
        const results = await xvideosSearch(q)
        if (!results.length) return reply("❌ No search results found for the given query.")

        const searchResults = results.map((res, i) => (
          `${i + 1}. *${res.title}*\nDuration: ${res.duration}\nURL: ${res.videoUrl}`
        )).join('\n\n')

        reply(`*Search Results for "${q}":*\n\n${searchResults}`)
      }

    } catch (e) {
      console.error(e)
      reply(`❌ Error: ${e.message || e}`)
    }
  }
)
