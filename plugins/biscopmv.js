
const config = require('../settings');
const { cmd } = require('../lib/command');
const axios = require('axios');
const NodeCache = require('node-cache');

cmd({
    pattern: "baiscopes",	
    react: '🔎',
    category: "movie",
    desc: "Baiscopes.lk movie search",
    use: ".baiscopes 2025",
    
    filename: __filename
},
async (conn, m, mek, { from, isPre, q, prefix, isMe,isSudo, isOwner, reply }) => {
try{


 if(!q) return await reply('*please give me text !..*')
let url = await fetchJson(`https://darksadas-yt-baiscope-search.vercel.app/?query=${q}`)

 if (!url || !url.data || url.data.length === 0) 
	{
		await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            return await conn.sendMessage(from, { text: '*No results found ❌*' }, { quoted: mek });
        }
var srh = [];  
for (var i = 0; i < url.data.length; i++) {
srh.push({
title: url.data[i].title,
description: '',
rowId: prefix + `bdl ${url.data[i].link}&${url.data[i].year}`
});
}

const sections = [{
title: "baiscopes.lk results",
rows: srh
}	  
]
const listMessage = {
text: `*_GOJO BAISCOPES MOVIE SEARCH RESULT 🎬_*

*\`Input :\`* ${q}`,
footer: settings.FOOTER,
title: 'baiscopes.lk results',
buttonText: '*Reply Below Number 🔢*',
sections
}
await conn.listMessage(from, listMessage,mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})
cmd({
    pattern: "bdl",	
    react: '🎥',
     desc: "moive downloader",
    filename: __filename
},
async (conn, m, mek, { from, q, isMe, isSudo, isOwner, prefix, reply }) => {
try{

    
  const urll = q.split("&")[0]
const im = q.split("&")[1]
  
let sadas = await fetchJson(`https://darksadas-yt-baiscope-info.vercel.app/?url=${urll}&apikey=pramashi`)
let msg = `*☘️ 𝗧ɪᴛʟᴇ ➮* *_${sadas.data.title   || 'N/A'}_*

*📅 𝗥ᴇʟᴇꜱᴇᴅ ᴅᴀᴛᴇ ➮* _${sadas.data.date   || 'N/A'}_
*💃 𝗥ᴀᴛɪɴɢ ➮* _${sadas.data.imdb  || 'N/A'}_
*⏰ 𝗥ᴜɴᴛɪᴍᴇ ➮* _${sadas.data.runtime   || 'N/A'}_
*💁‍♂️ 𝗦ᴜʙᴛɪᴛʟᴇ ʙʏ ➮* _${sadas.data.subtitle_author   || 'N/A'}_
*🎭 𝗚ᴇɴᴀʀᴇꜱ ➮* ${sadas.data.genres.join(', ')   || 'N/A'}
`

if (sadas.length < 1) return await conn.sendMessage(from, { text: 'erro !' }, { quoted: mek } )

var rows = [];  

rows.push({
      buttonId: prefix + `bdetails ${urll}&${im}`, buttonText: {displayText: 'Details send'}, type: 1}

);
	
  sadas.dl_links.map((v) => {
	rows.push({
        buttonId: prefix + `cdl ${im}±${v.link}±${sadas.data.title}
	
	*\`[ ${v.quality} ]\`*`,
        buttonText: { displayText: `${v.size} - ${v.quality}` },
        type: 1
          }
		 
		 
		 );
        })



  
const buttonMessage = {
 
image: {url: im.replace("-150x150", "") },	
  caption: msg,
  footer: settings.FOOTER,
  buttons: rows,
  headerType: 4
}
return await conn.buttonMessage(from, buttonMessage, mek)
} catch (e) {
    console.log(e)
  await conn.sendMessage(from, { text: '🚩 *Error !!*' }, { quoted: mek } )
}
})
cmd({
    pattern: "cdl",
    react: "⬇️",
    dontAddCommandList: true,
    filename: __filename
}, async (conn, mek, m, { from, q, isMe, reply }) => {
    
    if (!q) {
        return await reply('*Please provide a direct URL!*');
    }

    try {
        const datae = q.split("±")[0];
        const datas = q.split("±")[1];
        const dat = q.split("±")[2];

        let sadas = await fetchJson(`https://darksadas-yt-baiscope-dl.vercel.app/?url=${datas}&apikey=pramashi`);

        if (!sadas || !sadas.data || !sadas.data.dl_link || !sadas.data.dl_link.includes('https://drive.baiscopeslk')) {
            console.log('Invalid input:', q);
            return await reply('*❗ Sorry, this download url is incorrect. Please choose another number.*');
        }

        const mediaUrl = sadas.data.dl_link.trim();
        const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
        const mediaBuffer = Buffer.from(response.data, 'binary');
        const botimg = `${datae}`;

        await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });
        await conn.sendMessage(from, { text: '*Uploading your movie..⬆️*' });

        await conn.sendMessage(config.JID || from, { 
            document: { url: mediaUrl },
            caption: `*🎬 Name :* ${dat}\n\n`,
            mimetype: "video/mp4",
            jpegThumbnail: await (await fetch(botimg)).buffer(),
            fileName: `${dat}.mp4`,
	    footer: settings.FOOTER
        });

        await conn.sendMessage(from, { react: { text: '✔️', key: mek.key } });
        await conn.sendMessage(from, { text: `*Movie sent successfully to JID ${config.JID} ✔*` }, { quoted: mek });

    } catch (error) {
        console.error('Error fetching or sending:', error);
        await conn.sendMessage(from, { text: "*Error fetching this moment. Retry now ❗*" }, { quoted: mek });
    }
});
