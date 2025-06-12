const { cmd } = require('../lib/command');
const axios = require('axios');

// Search movies from SinhalaSub and ZoomSub
async function searchMovies(query) {
    const apis = [
        {
            url: `https://suhas-bro-api.vercel.app/movie/sinhalasub/search?text=${encodeURIComponent(query)}`,
            name: "SinhalaSub",
        },
        {
            url: `https://suhas-bro-api.vercel.app/movie/zoom/search?text=${encodeURIComponent(query)}`,
            name: "ZoomSub",
        },
    ];

    let allResults = [], errors = [];

    for (const api of apis) {
        try {
            const res = await axios.get(api.url, { timeout: 10000 });
            const parsed = Array.isArray(res.data.result)
                ? res.data.result.map(x => ({
                    title: x.title,
                    link: x.link,
                    year: x.year || "N/A",
                    source: api.name,
                }))
                : [];
            allResults.push(...parsed);
        } catch (err) {
            errors.push(`${api.name}: ${err.message}`);
        }
    }

    return { results: allResults.slice(0, 10), errors };
}

// Fetch movie details
async function getMovieDetails(url) {
    try {
        const res = await axios.get(`https://suhas-bro-api.vercel.app/movie/sinhalasub/movie?url=${encodeURIComponent(url)}`, { timeout: 10000 });
        const movie = res.data.result;
        if (!movie || !Array.isArray(movie.dl_links) || movie.dl_links.length === 0) throw new Error("No download links found.");
        return {
            title: movie.title,
            imdb: movie.imdb || "N/A",
            date: movie.date || "N/A",
            country: movie.country || "N/A",
            runtime: movie.runtime || "N/A",
            image: movie.image || "",
            dl_links: movie.dl_links.map(x => ({
                quality: x.quality,
                size: x.size,
                link: x.link,
            })),
        };
    } catch (e) {
        throw new Error(`Failed to fetch details: ${e.message}`);
    }
}

// Command: ck
cmd({
    pattern: "ck",
    alias: ["film"],
    react: "🎬",
    desc: "Search and download Sinhala-subbed movies",
    category: "movie",
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return reply("*Please provide a movie name to search (e.g., 'Deadpool')*");

        const { results, errors } = await searchMovies(q);
        if (results.length === 0) return reply(`*No results found for:* "${q}"\n${errors.join('\n')}`);

        let msg = `✨ *GOJO MD MOVIE DOWNLOADER* ✨\n\n🎥 *Results for* "${q}":\n\n`;
        results.forEach((r, i) => {
            msg += `*${i + 1}.* ${r.title} (${r.year}) [${r.source}]\n🔗 ${r.link}\n\n`;
        });
        msg += `📩 *Reply with the number of the movie to continue.*`;

        const sent = await conn.sendMessage(from, { text: msg }, { quoted: mek });
        const replyID = sent.key.id;

        conn.addReplyTracker(replyID, async (mek, res) => {
            if (!mek.message) return;
            const choice = parseInt(res.trim());
            if (isNaN(choice) || choice < 1 || choice > results.length) return reply("❌ Invalid number. Try again.");

            const selected = results[choice - 1];

            let movie;
            try {
                movie = await getMovieDetails(selected.link);
            } catch (err) {
                return reply(`*Error:* ${err.message}`);
            }

            let dlMsg = `🎬 *${movie.title}*\n\n*Available Downloads:*\n`;
            movie.dl_links.forEach((x, i) => {
                dlMsg += `*${i + 1}.* ${x.quality} - ${x.size}\n\n`;
            });
            dlMsg += `📩 *Reply with a number to download in that quality.*`;

            const sent2 = await conn.sendMessage(from, { text: dlMsg }, { quoted: mek });
            const reply2ID = sent2.key.id;

            conn.addReplyTracker(reply2ID, async (mek, res2) => {
                if (!mek.message) return;
                const choice2 = parseInt(res2.trim());
                if (isNaN(choice2) || choice2 < 1 || choice2 > movie.dl_links.length) {
                    return reply("❌ Invalid number. Try again.");
                }

                const file = movie.dl_links[choice2 - 1];

                const caption = `
🎬 *GOJO MD CINEMA* 🎥  
╔══════════════════════╗  
   Your Gateway to  
    🎥 Entertainment 🎥  
╚══════════════════════╝  

✨ 🎞 *${movie.title}*  
⭐ *IMDB:* ${movie.imdb}  
📅 *Date:* ${movie.date}  
🌍 *Country:* ${movie.country}  
⏳ *Length:* ${movie.runtime}  

╔═════ஜ۩۞۩ஜ═════╗  
© 2025 *GOJO MD*  
🚀 POWERED BY SAYURA  
╚═════ஜ۩۞۩ஜ═════╝`;

                await conn.sendMessage(from, { react: { text: '⬇️', key: sent2.key } });

                await conn.sendMessage(from, {
                    document: { url: file.link },
                    mimetype: "video/mp4",
                    fileName: `${movie.title} - ${file.quality}.mp4`,
                    caption,
                    contextInfo: {
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: '120363401755639074@newsletter',
                            newsletterName: "© GOJO MD💚",
                            serverMessageId: 999,
                        },
                        externalAdReply: {
                            title: movie.title,
                            body: '🎬 *GOJO-MD* 🎥',
                            mediaType: 1,
                            sourceUrl: selected.link,
                            thumbnailUrl: movie.image,
                            renderLargerThumbnail: true,
                            showAdAttribution: true,
                        },
                    },
                }, { quoted: mek });

                await conn.sendMessage(from, { react: { text: '✅', key: sent2.key } });
            });
        });

    } catch (e) {
        console.error("Movie plugin error:", e.stack);
        return reply(`❌ Error: ${e.message}`);
    }
});
