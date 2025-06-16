/*  baiscopes commands – search  ➜  info/buttons  ➜  direct download  */

const axios = require('axios');
const { cmd } = require('../lib/command');
const { fetchJson } = require('../lib/functions');
const config = require('../settings');

/* ---------- .baiscopes ------------------------------------------------ */
cmd({
    pattern: 'baiscopes',
    react: '🔎',
    category: 'movie',
    desc: 'Baiscopes.lk movie search',
    use: '.baiscopes <keyword>',
    filename: __filename
}, async (conn, m, mek, { from, q, prefix, reply }) => {
    if (!q) return reply('*please give me text !..*');

    const res = await fetchJson(
        `https://darksadas-yt-baiscope-search.vercel.app/?query=${encodeURIComponent(q)}`
    );

    if (!res?.data?.length) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        return conn.sendMessage(from, { text: '*No results found ❌*' }, { quoted: mek });
    }

    const rows = res.data.map(v => ({
        title: v.title,
        description: '',
        rowId: `${prefix}bdl ${v.link}&${v.img}`  // pass info-url & poster
    }));

    const listMessage = {
        text: `*_BAISCOPES MOVIE SEARCH RESULT 🎬_*\n\n*\`Input :\`* ${q}`,
        footer: config.FOOTER,
        title: 'baiscopes.lk results',
        buttonText: '*Reply Below Number 🔢*',
        sections: [{ title: 'baiscopes.lk results', rows }]
    };

    await conn.listMessage(from, listMessage, mek);
});

/* ---------- .bdl  (movie info & quality buttons) ---------------------- */
cmd({
    pattern: 'bdl',
    react: '🎥',
    desc: 'movie downloader',
    filename: __filename
}, async (conn, m, mek, { from, q, prefix, reply }) => {
    try {
        const [infoUrl, poster] = q.split('&');
        const info = await fetchJson(
            `https://darksadas-yt-baiscope-info.vercel.app/?url=${infoUrl}&apikey=pramashi`
        );

        if (!info?.data) return reply('*Error fetching info*');

        const d = info.data;
        const caption = [
            `*☘️ 𝗧ɪᴛʟᴇ ➮* _${d.title || 'N/A'}_`,
            `*📅 𝗥ᴇʟᴇᴀꜱᴇ ᴅᴀᴛᴇ ➮* _${d.date || 'N/A'}_`,
            `*💃 𝗜ᴍᴅʙ ➮* _${d.imdb || 'N/A'}_`,
            `*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* _${d.runtime || 'N/A'}_`,
            `*💁‍♂️ 𝗦ᴜʙ ʙʏ ➮* _${d.subtitle_author || 'N/A'}_`,
            `*🎭 𝗚ᴇɴʀᴇꜱ ➮* ${Array.isArray(d.genres) ? d.genres.join(', ') : 'N/A'}`
        ].join('\n');

        const buttons = [
            {
                buttonId: `${prefix}bdetails ${infoUrl}&${poster}`,
                buttonText: { displayText: 'Details send' },
                type: 1
            },
            ...info.dl_links.map(v => ({
                buttonId: `${prefix}cdl ${poster}±${v.link}±${d.title}`,
                buttonText: { displayText: `${v.size} - ${v.quality}` },
                type: 1
            }))
        ];

        const msg = {
            image: { url: poster.replace('-150x150', '') },
            caption,
            footer: config.FOOTER,
            buttons,
            headerType: 4
        };

        await conn.buttonMessage(from, msg, mek);
    } catch (e) {
        console.log(e);
        reply('🚩 *Error !!*');
    }
});

/* ---------- .cdl  (direct drive link ➜ send) -------------------------- */
cmd({
    pattern: 'cdl',
    react: '⬇️',
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply('*Please provide a direct URL!*');

    try {
        const [poster, driveUrl, title] = q.split('±');

        const dl = await fetchJson(
            `https://darksadas-yt-baiscope-dl.vercel.app/?url=${driveUrl}&apikey=pramashi`
        );

        const gDrive = dl?.data?.dl_link?.trim();
        if (!gDrive?.startsWith('https://drive.baiscopeslk')) {
            console.log('Invalid input:', q);
            return reply('*❗ Sorry, this download url is incorrect. Please choose another number.*');
        }

        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
        await conn.sendMessage(from, { text: '*Uploading your movie..⬆️*' });

        await conn.sendMessage(config.JID || from, {
            document: { url: gDrive },
            caption: `*🎬 Name :* ${title}\n`,
            mimetype: 'video/mp4',
            jpegThumbnail: await (await axios.get(poster, { responseType: 'arraybuffer' })).data,
            fileName: `${title}.mp4`
        });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
        await conn.sendMessage(from, { text: `*Movie sent successfully ✔*` }, { quoted: mek });

    } catch (e) {
        console.error('Error fetching or sending:', e);
        reply('*Error fetching this moment. Retry now ❗*');
    }
});