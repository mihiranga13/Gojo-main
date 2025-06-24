const { cmd } = require('../lib/command');
const axios = require('axios');

const BRAND = '✫☘𝐆𝐎𝐉𝐎 𝐌𝐎𝐕𝐈𝐄 𝐇𝐎𝐌𝐄☢️☘';

cmd({
    pattern: 'cine',
    alias: ['cines', 'cinesubz'],
    react: '🎬',
    desc: 'Search & download movies from CineSubz',
    category: 'movie',
    filename: __filename
}, async (conn, mek, m, { from, q }) => {
    const query = (q || '').trim();
    if (query.length < 2) {
        return conn.sendMessage(from, { text: '*🎬 CineSubz Search*\n\n📌 Usage: .cine <movie name>\n🧪 Example: .cine Deadpool\n\n💡 Reply "done" to cancel' }, { quoted: mek });
    }

    try {
        // Search API call
        const searchRes = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(query)}`, { timeout: 10000 });
        if (!searchRes.data?.status || !searchRes.data.result?.data?.length) {
            throw new Error('No results found.');
        }
        const movies = searchRes.data.result.data;

        // Build search results message
        let listText = '*🎬 SEARCH RESULTS*\n\n';
        movies.forEach((movie, i) => {
            listText += `🎥 ${i + 1}. *${movie.title}* (${movie.year || 'N/A'})\n⭐ IMDB: ${movie.imdb || 'N/A'}\n\n`;
        });
        listText += '🔢 Reply with the number to choose or "done" to cancel.';

        // Send search result
        const sentMsg = await conn.sendMessage(from, { text: listText }, { quoted: mek });

        // Listener for user reply to pick movie
        const listener = async ({ messages }) => {
            const msg = messages?.[0];
            if (!msg?.message?.extendedTextMessage) return;
            const body = msg.message.extendedTextMessage.text.trim().toLowerCase();
            const replyTo = msg.message.extendedTextMessage.contextInfo?.stanzaId;
            if (replyTo !== sentMsg.key.id) return;

            if (body === 'done') {
                await conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: msg });
                conn.ev.off('messages.upsert', listener);
                return;
            }

            const index = parseInt(body);
            if (isNaN(index) || index < 1 || index > movies.length) {
                await conn.sendMessage(from, { text: '❌ Invalid number. Try again.' }, { quoted: msg });
                return;
            }

            const selectedMovie = movies[index - 1];

            // Fetch movie details with download links
            try {
                const detailsRes = await axios.get(`https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(selectedMovie.link)}`, { timeout: 10000 });
                const details = detailsRes.data;

                if (!details.status || !details.result.data.dl_links || details.result.data.dl_links.length === 0) {
                    await conn.sendMessage(from, { text: '❌ No valid download links found.' }, { quoted: msg });
                    return;
                }

                // Build download qualities list
                const dlLinks = details.result.data.dl_links.filter(dl => dl.link && dl.quality);
                if (dlLinks.length === 0) {
                    await conn.sendMessage(from, { text: '❌ No downloadable qualities available.' }, { quoted: msg });
                    return;
                }

                let dlText = `*🎬 ${details.result.data.title}*\n\n📥 Choose quality:\n\n`;
                dlLinks.forEach((dl, i) => {
                    dlText += `${i + 1}. *${dl.quality}* (${dl.size || 'N/A'})\n`;
                });
                dlText += '\n🔢 Reply with number or "done" to cancel.';

                // Send qualities message
                const qualMsg = await conn.sendMessage(from, { text: dlText }, { quoted: msg });

                // Listener for quality selection
                const qualListener = async ({ messages }) => {
                    const qMsg = messages?.[0];
                    if (!qMsg?.message?.extendedTextMessage) return;
                    const qBody = qMsg.message.extendedTextMessage.text.trim().toLowerCase();
                    const qReplyTo = qMsg.message.extendedTextMessage.contextInfo?.stanzaId;
                    if (qReplyTo !== qualMsg.key.id) return;

                    if (qBody === 'done') {
                        await conn.sendMessage(from, { text: '✅ Cancelled.' }, { quoted: qMsg });
                        conn.ev.off('messages.upsert', qualListener);
                        return;
                    }

                    const qIndex = parseInt(qBody);
                    if (isNaN(qIndex) || qIndex < 1 || qIndex > dlLinks.length) {
                        await conn.sendMessage(from, { text: '❌ Invalid quality number. Try again.' }, { quoted: qMsg });
                        return;
                    }

                    const chosen = dlLinks[qIndex - 1];
                    const link = chosen.link;
                    if (!link) {
                        await conn.sendMessage(from, { text: '❌ Download link not found.' }, { quoted: qMsg });
                        return;
                    }

                    // Optional: check file size to avoid huge files
                    // Just send link and movie info

                    await conn.sendMessage(from, {
                        document: { url: link },
                        mimetype: 'video/mp4',
                        fileName: `${BRAND} • ${details.result.data.title} • ${chosen.quality}.mp4`,
                        caption: `🎬 *${details.result.data.title}*\n📊 Quality: ${chosen.quality}\n🔗 Download link: ${link}\n\n${BRAND}`
                    }, { quoted: qMsg });

                    await conn.sendMessage(from, { react: { text: '✅', key: qMsg.key } });

                    // Remove listeners after done
                    conn.ev.off('messages.upsert', qualListener);
                    conn.ev.off('messages.upsert', listener);
                };

                conn.ev.on('messages.upsert', qualListener);
            } catch (err) {
                await conn.sendMessage(from, { text: '❌ Failed to fetch movie details.' }, { quoted: msg });
            }
        };

        conn.ev.on('messages.upsert', listener);
    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { text: `❌ Error: ${err.message || 'Something went wrong!'}` }, { quoted: mek });
    }
});
