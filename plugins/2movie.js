const { fetchJson } = require('../lib/functions');
const { cmd } = require('../lib/command');
const { getBuffer, sleep } = require('../lib/functions');

const replyStates = new Map(); // Store user states by messageID

cmd({
  pattern: "cines",
  alias: ["ci"],
  react: "🎬",
  desc: "Search and download movies from CineSubz",
  category: "movie",
  filename: __filename,
}, async (conn, m, mek, { from, q, isME, reply }) => {
  try {
    if (!q) return await reply("*Please provide a movie name to search! (e.g., Avatar)*");

    // Step 1: Search movies
    const searchResponse = await fetchJson(
      `https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(q)}`
    );

    if (!searchResponse.status || !searchResponse.result?.data?.length) {
      return await reply(`*No results found for:* "${q}"`);
    }

    const searchResults = searchResponse.result.data;

    // Build search result message
    let resultsMessage = `✨ *QUEEN ANJU CINESUBZ DOWNLOADER* ✨\n\n🎥 *Search Results for* "${q}":\n\n`;
    searchResults.forEach((r, i) => {
      resultsMessage += `*${i + 1}.* ${r.title} (${r.year})\n🔗 Link: ${r.link}\n\n`;
    });

    await sleep(2000);
    const sentMsg = await conn.sendMessage(from, { text: resultsMessage }, { quoted: mek });
    const messageID = sentMsg.key.id;
    const senderID = m.key.participant || m.key.remoteJid;

    // Save state for first reply (select movie)
    replyStates.set(messageID, {
      step: 'selectMovie',
      searchResults,
      senderID,
      retries: 0,
    });

  } catch (e) {
    console.error("Error during CineSubz command execution:", e);
    await reply("*An error occurred while processing your request.*");
  }
});

// Listen for replies globally (implement this listener where you handle all incoming messages)
async function onReply(conn, mek) {
  try {
    if (!mek.message) return;

    const quoted = mek.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return; // No quoted message means no state

    const quotedMsgID = mek.message.extendedTextMessage.contextInfo.stanzaId;
    if (!replyStates.has(quotedMsgID)) return; // Not tracking this message ID

    const state = replyStates.get(quotedMsgID);
    const senderID = mek.key.participant || mek.key.remoteJid;

    // Ensure the same user replies
    if (senderID !== state.senderID) return;

    const text = mek.message.conversation?.trim() || mek.message.extendedTextMessage?.text?.trim();
    if (!text) return;

    if (state.step === 'selectMovie') {
      // Validate input number
      const selectedNumber = parseInt(text);
      if (isNaN(selectedNumber) || selectedNumber < 1 || selectedNumber > state.searchResults.length) {
        state.retries++;
        if (state.retries >= 3) {
          await conn.sendMessage(state.senderID, { text: "*Too many invalid attempts. Please start again by searching the movie.*" });
          replyStates.delete(quotedMsgID);
          return;
        }
        await conn.sendMessage(state.senderID, { text: "Invalid selection. Please reply with a valid number from the list." });
        return;
      }

      const selectedMovie = state.searchResults[selectedNumber - 1];

      // Fetch download links
      const movieResponse = await fetchJson(
        `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(selectedMovie.link)}`
      );

      if (!movieResponse.status || !movieResponse.result?.data?.dl_links) {
        await conn.sendMessage(state.senderID, { text: "*Error fetching download links for this movie.*" });
        replyStates.delete(quotedMsgID);
        return;
      }

      const movieData = movieResponse.result.data;

      if (movieData.dl_links.length === 0) {
        await conn.sendMessage(state.senderID, { text: "*No download links available for this movie.*" });
        replyStates.delete(quotedMsgID);
        return;
      }

      // Send download options
      let downloadMessage = `🎥 *${movieData.title}*\n\n*Available Download Links:*\n`;
      movieData.dl_links.forEach((link, i) => {
        downloadMessage += `*${i + 1}.* ${link.quality} - ${link.size}\n\n`;
      });

      const sentDownloadMsg = await conn.sendMessage(state.senderID, { text: downloadMessage }, { quoted: mek });
      const downloadMsgID = sentDownloadMsg.key.id;

      // Update state to next step
      replyStates.set(downloadMsgID, {
        step: 'selectQuality',
        movieData,
        selectedMovie,
        senderID: state.senderID,
        retries: 0,
      });

      replyStates.delete(quotedMsgID); // Delete previous state
    }

    else if (state.step === 'selectQuality') {
      const selectedQuality = parseInt(text);
      if (isNaN(selectedQuality) || selectedQuality < 1 || selectedQuality > state.movieData.dl_links.length) {
        state.retries++;
        if (state.retries >= 3) {
          await conn.sendMessage(state.senderID, { text: "*Too many invalid attempts. Please start again by searching the movie.*" });
          replyStates.delete(quotedMsgID);
          return;
        }
        await conn.sendMessage(state.senderID, { text: "Invalid selection. Please reply with a valid number corresponding to download quality." });
        return;
      }

      const selectedLink = state.movieData.dl_links[selectedQuality - 1];

      // Fetch direct download link
      const movieLinkResponse = await fetchJson(
        `https://cinesubz-api-zazie.vercel.app/api/links?url=${encodeURIComponent(selectedLink.link)}`
      );

      if (!movieLinkResponse?.result?.direct) {
        console.error('API response lacks direct link:', movieLinkResponse);
        await conn.sendMessage(state.senderID, { text: "*Failed to retrieve direct download link. The link may be invalid or unavailable.*" });
        replyStates.delete(quotedMsgID);
        return;
      }

      const downloadUrl = movieLinkResponse.result.direct;
      const { title, imdbRate, image, date, country, duration } = state.movieData;
      const sendto = isME ? (conf.MOVIE_JID || state.senderID) : state.senderID;

      const downloadMessag = `
🎬 *𝚀𝚄𝙴𝙴𝙽 𝙰𝙽𝙹𝚄 𝗫ᴾᴿᴼ 𝗖𝗜𝗡𝗘𝗠𝗔* 🎥  
╔══════════════════════════╗  
   𝙔𝙤𝙪𝙧 𝙂𝙖𝙩𝙚𝙬𝙖𝙮 𝙩𝙤  
    🎥 𝗘𝗻𝘁𝗲𝗿𝘁𝗮𝗶𝗻𝗺𝗲𝗻𝘁 🎥  
╚══════════════════════════╝  

✨ 🎥 **🎞 Movie:** *${title}*  

⭐ *𝗜𝗠𝗗𝗕 𝗥𝗮𝘁𝗶𝗻𝗴:* *${imdbRate}*  
📅 *�_R𝗲𝗹𝗲𝗮𝘀𝗲 𝗗𝗮𝘁𝗲:* *${date}*  
🌍 *𝗖𝗼𝘂𝗻𝘁𝗿𝘆:* *${country}*  
⏳ *𝗗𝘂𝗿𝗮𝘁𝗶𝗼𝗻:* *${duration}*  

╔═════ஜ۩۞۩ஜ═════╗  
© 𝟸𝟶𝟸𝟻 *Queen Anju XPRO*  
🚀 *𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗚𝗮𝗺𝗶𝗻𝗴 𝗥𝗮𝘀𝗵*  
🔗 *GitHub:github.com/Mrrashmika/Queen_Anju-MD*  
📡 _Stay Connected. Stay Entertained!_  
╚═════ஜ۩۞۩ஜ═════╝`;

      await conn.sendMessage(state.senderID, { react: { text: '⬆️', key: mek.key } });

      await conn.sendMessage(
        sendto,
        {
          document: { url: downloadUrl },
          mimetype: "video/mp4",
          fileName: `${title} - ${selectedLink.quality}.mp4`,
          caption: downloadMessag,
          contextInfo: {
            externalAdReply: {
              title: title,
              body: '🎬 *𝚀𝚄𝙴𝙴𝙽 𝙰𝙽𝙹𝚄 𝗫ᴾᴿᴼ 𝗖𝗜𝗡𝗘𝗠𝗔* 🎥',
              mediaType: 1,
              sourceUrl: state.selectedMovie.link,
              thumbnailUrl: image,
              renderLargerThumbnail: true,
              showAdAttribution: true,
            },
          },
        },
        { quoted: mek }
      );

      await conn.sendMessage(state.senderID, { react: { text: '✅', key: mek.key } });

      // Clean up state after completion
      replyStates.delete(quotedMsgID);
    }
  } catch (e) {
    console.error("Error processing reply:", e);
  }
}

module.exports.onReply = onReply;
