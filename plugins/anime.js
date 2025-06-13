const config = require('../settings')
const { cmd, commands } = require('../lib/command')
const { getBuffer, fetchJson } = require('../lib/functions')
const { sizeFormatter } = require('human-readable')
const GDriveDl = require('../lib/gdrive.js'); // ✅ CORRECT
const N_FOUND = "*I couldn't find anything :(*"

cmd({
    pattern: "slanimeclub",
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, l, reply }) => {
    try {
        if (!q) return await reply('*Please Give Me Text..! 🖊️*')

        const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/search?q=${q}&apikey=vajiraofficial`)

        if (!data?.data?.data?.data?.length) {
            return await conn.sendMessage(from, { text: N_FOUND }, { quoted: mek })
        }

        const srh = data.data.data.data.map((item, i) => ({
            title: `${i + 1}`,
            description: item.title,
            rowId: `${prefix}slanime ${item.link}`
        }))

        const sections = [{ title: "_[Result from slanimeclub.]_", rows: srh }]

        const listMessage = {
            text: '',
            footer: config.FOOTER,
            title: 'Result from slanimeclub. 📲',
            buttonText: '*🔢 Reply below number*',
            sections
        }

        return await conn.replyList(from, listMessage, { quoted: mek })
    } catch (e) {
        reply('*ERROR !!*')
        l(e)
    }
})

cmd({
    pattern: "slanime",
    react: '📑',
    category: "movie",
    desc: "slanimeclub movie downloader",
    filename: __filename
}, async (conn, m, mek, { from, prefix, q, l, reply }) => {
    try {
    
    
        if (!q) return await reply('*Please Give Me Text..! 🖊️*')

if (q.includes("https://slanimeclub.co/movies")) {


        const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/movie?url=${q}&apikey=vajiraofficial`)
        const movie = data.data?.data?.moviedata

        if (!movie) return await reply(N_FOUND)

        const cap = `*_\u2618 Title: ${movie.title}_*\n\n- *Date:* ${movie.date}\n- *Generous* ${movie.generous}\n\n*\u2692\ufe0f Link:* ${q}`

        if (!movie.seasons?.length) return await reply(N_FOUND)

        const srh = movie.seasons.map((s, i) => ({
            title: `${i + 1}`,
            description: `${s.title} | ${s.number} | ${s.date}`,
            rowId: `${prefix}slanimedl ${s.link}|${s.title}`
        }))

        const sections = [{ title: "_[Result from slanimeclub.]_", rows: srh }]

        const listMessage = {
            caption: cap,
            image: { url: movie.image },
            footer: config.FOOTER,
            title: 'Result from slanimeclub. 📲',
            buttonText: '*🔢 Reply below number*',
            sections
        }

        return await conn.replyList(from, listMessage, { quoted: mek })
        
        } if (q.includes("https://slanimeclub.co/tvshow")) {
        
const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/tvshow?url=${q}&apikey=vajiraofficial`)

        if (data.data.data.length < 1) return await conn.sendMessage(from, { text: lang ? "*මට කිසිවක් සොයාගත නොහැකි විය :(*" : "*No results found :(*" }, { quoted: mek });
    
        var srh = [];  
        for (var i = 0; i < data.data.data.length; i++) {
            srh.push({
                title: i + 1,
                description: `${data.data.data.episodes[i].title}|| 'N/A'}\n┃ 🌍 Date: ${data.data.data.episodes[i].date}\n┃ 🔗 Url: ${data.data.data.episodes[i].link}_\n┃━━━━━━━━━━━━━━━\n`,
                rowId: prefix + 'slanimedl ' + data.data.data.episodes[i].link
            });
        }

        const sections = [{
            title: "_[Result from slanimeclub.]_",
            rows: srh
        }];
        

        const listMessage = {
            text: '',
            footer: config.FOOTER,
            title: 'Result from slanimeclub. 📲',
            buttonText: '*🔢 Reply below number*',
            sections
        }

        return await conn.replyList(from, listMessage, { quoted: mek })
        
        }
        
    } catch (e) {
        reply('*ERROR !!*')
        l(e)
    }
})

cmd({
    pattern: 'slanimedl',
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return await reply('*Please provide a direct URL!*')

    try {
        const [mediaUrl, title = 'tdd_movie_dl_system'] = q.split("|")

        const data = await fetchJson(`https://vajira-movie-api.vercel.app/api/slanimeclub/download?url=${mediaUrl}&apikey=vajiraofficial`)
        const dl_link = data?.data?.data?.link

        if (!dl_link) return await reply('*Unable to fetch download link.*')

        await reply('╭═════════════════❀\n│  UPLOADING YOUR MOVIE 📥\n│ ❀ Target : WAIT FEW MINUTES...\n│ ❀ Use commands after come the movie\n│ ❀ Device : 1/3\n╰═════════════════❀')

        if (dl_link.includes("slanimeclub.co")) {
            const message = {
                document: await getBuffer(dl_link),
                caption: `${title}\n\n${config.FOOTER}`,
                mimetype: "video/mp4",
                fileName: `${title}.mp4`
            }
            await conn.sendMessage(from, message)

        } else if (dl_link.includes("drive.google.com")) {
            const res = await GDriveDl(dl_link)

            if (res?.downloadUrl) {
                const txt = `*[ Downloading file ]*\n\n*Name :* ${res.fileName}\n*Size :* ${res.fileSize}\n*Type :* ${res.mimetype}`
                await reply(txt)
                await conn.sendMessage(from, {
                    document: { url: res.downloadUrl },
                    caption: `${res.fileName}\n\n${config.FOOTER}`,
                    fileName: res.fileName,
                    mimetype: res.mimetype
                }, { quoted: mek })
            } else {
                await reply('*Google Drive Link is not downloadable.*')
            }
        } else {
            await reply('*Unsupported download link format.*')
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } })

    } catch (error) {
        console.error('Error fetching or sending:', error)
        await reply('*Error fetching or sending*')
    }
})
