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

        if (data.data.data.episodes.length < 1) return await conn.sendMessage(from, { text: lang ? "*මට කිසිවක් සොයාගත නොහැකි විය :(*" : "*No results found :(*" }, { quoted: mek });
    
        var srh = [];  
        for (var i = 0; i < data.data.data.episodes.length; i++) {
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
    pattern: `slanimedl`,
    react: "📥",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, isDev, reply }) => {

  

    if (!q) {
        return await reply(config.LANG === 'en' ? '*Please provide a direct URL!*' : '*කරුණාකර තොරතුරු URL එකක් ලබා දෙන්න!*');
    }

    try {
        const mediaUrl = q.split("|")[0];
        const title = q.split("|")[1] || 'tdd_movie_dl_system';
        const data = await fetchJson(`${config.API}/api/slanimeclub/download?url=${mediaUrl}&apikey=${config.APIKEY}`);
        const dl_link = `${data.data.data.link}`;

        const msg = config.LANG === 'en' ? 'PLEASE WAIT.... DON\'T USE ANY COMMANDS 🚫' : 'කරුණාකර රුචිකර කරන්න.... ඕනෑම කමාන්ඩ් එකක් භාවිතා නොකරන්න 🚫';
        await conn.sendMessage(from, { text: msg });

        const loadingMessage = await conn.sendMessage(from, { text: config.LANG === 'en' ? 'UPLOADING' : 'උඩුගත කරනවා' });

        const emojiMessages = [
            "UPLOADING ●○○○○", "UPLOADING ●●○○○", "UPLOADING ●●●○○", "UPLOADING ●●●●○", "UPLOADING ●●●●●",
            "UPLOADING ●○○○○", "UPLOADING ●●○○○", "UPLOADING ●●●○○", "UPLOADING ●●●●○", "UPLOADING ●●●●●",
            config.LANG === 'en' ? "UPLOADING YOUR MOVIE" : "ඔබගේ චිත්‍රපටය උඩුගත කරනවා"
        ];

        for (const line of emojiMessages) {
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay for 1 second
            await conn.relayMessage(
                from,
                {
                    protocolMessage: {
                        key: loadingMessage.key,
                        type: 14,
                        editedMessage: {
                            conversation: line,
                        },
                    },
                },
                {}
            );
        }

        if (dl_link.includes("https://slanimeclub.co")) {

            await conn.sendMessage(from, {
                document: {
                    url: dl_link
                },
                caption: `${title}\n\n${config.FOOTER}`,
                mimetype: "video/mp4",
                jpegThumbnail: await getThumbnailBuffer(config.LOGO),
                fileName: `${title}.mp4`
            });

            reply(config.LANG === 'en' ? 'SUCCESSFULLY UPLOADED YOUR MOVIE ✅' : 'ඔබගේ චිත්‍රපටය සාර්ථකව උඩුගත කර ඇත ✅');
        }

        if (dl_link.includes("https://drive.google.com")) {
    
    const match = dl_link.match(/\/d\/(.+?)\//);
    if (!match) return reply("❌ Invalid Google Drive file link format.");

    const fileId = match[1];
    const url = `https://drive.google.com/uc?export=download&id=${fileId}`;

    const res = await axios.get(url, { responseType: "text" });

    if (res.headers["content-disposition"]) {
        // Direct download for small files
        return await conn.sendMessage(from, {
            document: { url },
            caption: `📦 *Google Drive File:*\n*🎬 Title:* ${title}\n\n${config.FOOTER}`,
            mimetype: "application/octet-stream",
            jpegThumbnail: await getThumbnailBuffer(config.LOGO),
            fileName: `${title}.mp4`
        }, { quoted: mek });
    }

    // Handle large files that need confirmation token
    const $ = cheerio.load(res.data);
    const confirm = $('form').attr('action');
    const confirmUrl = `https://drive.google.com${confirm}`;

    const finalRes = await axios.post(confirmUrl, null, {
        responseType: "stream",
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const fileName = `${title}.mp4`;

    await conn.sendMessage(from, {
        document: finalRes.data,
        fileName,
        caption: `📦 *Google Drive File:*\n*🎬 Title:* ${title}\n\n${config.FOOTER}`,
        mimetype: "application/octet-stream",
        jpegThumbnail: await getThumbnailBuffer(config.LOGO)
    }, { quoted: mek });

    reply(config.LANG === 'en' ? '✅ *Successfully uploaded your movie!*' : '✅ *ඔබගේ චිත්‍රපටය සාර්ථකව උඩුගත කර ඇත!*');
}


        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (error) {
        console.error('Error fetching or sending', error);
        await conn.sendMessage(from, config.LANG === 'en' ? '*Error fetching or sending*' : '*දෝෂයක් සොයාගැනීම හෝ එවීම*', { quoted: mek });
    }
});