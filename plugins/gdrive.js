const { fetchJson } = require('../lib/functions')
const { cmd } = require('../lib/command')

let baseUrl;

(async () => {
  try {
    const res = await fetchJson('https://raw.githubusercontent.com/prabathLK/PUBLIC-URL-HOST-DB/main/public/url.json')
    baseUrl = res.api
    console.log('Base URL fetched:', baseUrl)
  } catch (error) {
    console.error('Failed to fetch baseUrl:', error)
  }
})()

cmd({
  pattern: 'gdrive5',
  desc: 'Download Google Drive files (public links only)',
  category: 'download',
  react: '⬇️',
  filename: __filename
},
async (conn, mek, m, { from, reply, args, q }) => {
  try {
    if (!q || !q.startsWith('https://')) return reply('Please provide a valid Google Drive file URL.')

    if (!baseUrl) return reply('Server is still initializing, please try again in a moment.')

    reply('*Downloading your file...*')

    // Construct API URL to get download info
    const apiUrl = `${baseUrl}/api/gdrivedl?url=${encodeURIComponent(q)}`

    // Fetch data from API
    const data = await fetchJson(apiUrl)

    if (!data || !data.data || !data.data.download) {
      return reply('❌ Failed to fetch download link. Make sure the link is public and correct.')
    }

    // Send document to chat
    await conn.sendMessage(from, {
      document: {
        url: data.data.download
      },
      fileName: data.data.fileName || 'file',
      mimetype: data.data.mimeType || 'application/octet-stream',
      caption: `Downloaded: ${data.data.fileName || 'file'}`
    }, { quoted: mek })

  } catch (e) {
    console.error('Error in gdrive5 command:', e)
    reply(`❌ Error: ${e.message || e}`)
  }
})
