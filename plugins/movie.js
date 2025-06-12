const l = console.log;
const config = require('../settings');
const { cmd, commands } = require('../lib/command');
const axios = require('axios');
const NodeCache = require('node-cache');

const searchCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

cmd({
  pattern: "movie",
  react: "🎬",
  desc: "Search and download Movies/TV Series",
  category: "media",
  filename: __filename,
}, async (conn, mek, m, { from, q, pushname }) => {
  if (!q) {
    await conn.sendMessage(from, {
      text: `*🎬 Movie / TV Series Search*\n\n📋 Usage: .movie <name>\n📝 Example: .movie Breaking Bad\n\n💡 Reply 'done' to stop the process`
    }, { quoted: mek });
    return;
  }

  try {
    const cacheKey = `film_search_${q.toLowerCase()}`;
    let searchData = searchCache.get(cacheKey);

    if (!searchData) {
      const searchUrl = `https://apis.davidcyriltech.my.id/movies/search?query=${encodeURIComponent(q)}`;
      let retries = 3;
      while (retries > 0) {
        try {
          const response = await axios.get(searchUrl, { timeout: 10000 });
          searchData = response.data;
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw new Error("Failed to retrieve data. Try again later.");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!searchData.status || !searchData.results || searchData.results.length === 0) {
        throw new Error("No results found for the given name.");
      }

      searchCache.set(cacheKey, searchData);
    }

    const films = searchData.results.map((film, index) => ({
      number: index + 1,
      title: film.title,
      imdb: film.imdb,
      year: film.year,
      link: film.link,
      image: film.image
    }));

    let filmList = `*🎬 SEARCH RESULTS*\n\n`;
    films.forEach(film => {
      filmList += `🎥 ${film.number}. *${film.title}*\n`;
      filmList += `   ⭐ IMDB: ${film.imdb}\n`;
      filmList += `   📅 Year: ${film.year}\n\n`;
    });
    filmList += `🔢 Select a number to choose\n❌ Reply 'done' to cancel`;

    const movieListMessage = await conn.sendMessage(from, {
      image: { url: films[0].image },
      caption: filmList
    }, { quoted: mek });

    const movieListMessageKey = movieListMessage.key;
    const downloadOptionsMap = new Map();

    const selectionHandler = async (update) => {
      const message = update.messages[0];
      if (!message.message || !message.message.extendedTextMessage) return;

      const replyText = message.message.extendedTextMessage.text.trim();
      const repliedToId = message.message.extendedTextMessage.contextInfo.stanzaId;

      if (replyText.toLowerCase() === "done") {
        conn.ev.off("messages.upsert", selectionHandler);
        downloadOptionsMap.clear();
        await conn.sendMessage(from, {
          text: `✅ Process stopped. Use .movie <name> to search again.`
        }, { quoted: message });
        return;
      }

      if (repliedToId === movieListMessageKey.id) {
        const selectedNumber = parseInt(replyText);
        const selectedFilm = films.find(f => f.number === selectedNumber);

        if (!selectedFilm) {
          await conn.sendMessage(from, {
            text: `❌ Invalid number. Please try again.`
          }, { quoted: message });
          return;
        }

        const downloadUrl = `https://apis.davidcyriltech.my.id/movies/download?url=${encodeURIComponent(selectedFilm.link)}`;
        let downloadData;
        let retries = 3;

        while (retries > 0) {
          try {
            const response = await axios.get(downloadUrl, { timeout: 10000 });
            downloadData = response.data;
            if (!downloadData.status || !downloadData.movie || !downloadData.movie.download_links) {
              throw new Error("Invalid download response.");
            }
            break;
          } catch (err) {
            retries--;
            if (retries === 0) {
              await conn.sendMessage(from, {
                text: `❌ Error: ${err.message}\nPlease try another movie.`
              }, { quoted: message });
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const allLinks = downloadData.movie.download_links;
        const downloadLinks = [];

        const sd = allLinks.find(l => l.quality === "SD 480p" && l.direct_download);
        if (sd) downloadLinks.push({ number: 1, quality: "SD", size: sd.size, url: sd.direct_download });

        let hd = allLinks.find(l => l.quality === "HD 720p" && l.direct_download);
        if (!hd) hd = allLinks.find(l => l.quality === "FHD 1080p" && l.direct_download);
        if (hd) downloadLinks.push({ number: 2, quality: "HD", size: hd.size, url: hd.direct_download });

        if (downloadLinks.length === 0) {
          await conn.sendMessage(from, {
            text: `❌ No valid download links found. Try another title.`
          }, { quoted: message });
          return;
        }

        let qualityList = `*🎬 ${selectedFilm.title}*\n\n📥 Choose Quality:\n\n`;
        downloadLinks.forEach(dl => {
          qualityList += `${dl.number}. *${dl.quality}* (${dl.size})\n`;
        });
        qualityList += `\n🔢 Reply with number\n❌ Reply 'done' to stop`;

        const qualityMsg = await conn.sendMessage(from, {
          image: { url: downloadData.movie.thumbnail || selectedFilm.image },
          caption: qualityList
        }, { quoted: message });

        downloadOptionsMap.set(qualityMsg.key.id, { film: selectedFilm, downloadLinks });
      }

      else if (downloadOptionsMap.has(repliedToId)) {
        const { film, downloadLinks } = downloadOptionsMap.get(repliedToId);
        const selectedQuality = parseInt(replyText);
        const selected = downloadLinks.find(dl => dl.number === selectedQuality);

        if (!selected) {
          await conn.sendMessage(from, {
            text: `❌ Invalid quality selection.`
          }, { quoted: message });
          return;
        }

        const size = selected.size.toLowerCase();
        let sizeInGB = 0;
        if (size.includes("gb")) sizeInGB = parseFloat(size.replace("gb", ""));
        else if (size.includes("mb")) sizeInGB = parseFloat(size.replace("mb", "")) / 1024;

        if (sizeInGB > 2) {
          await conn.sendMessage(from, {
            text: `⚠️ File too large to send via bot.\n\n*Direct Link:*\n${selected.url}`
          }, { quoted: message });
          return;
        }

        try {
          await conn.sendMessage(from, {
            document: { url: selected.url },
            mimetype: "video/mp4",
            fileName: `${film.title} - ${selected.quality}.mp4`,
            caption: `🎬 *${film.title}*\n📊 Size: ${selected.size}\n✅ Download Complete`
          }, { quoted: message });

          await conn.sendMessage(from, { react: { text: "✅", key: message.key } });
        } catch (err) {
          await conn.sendMessage(from, {
            text: `❌ Error sending file\nUse direct link:\n${selected.url}`
          }, { quoted: message });
        }
      }
    };

    conn.ev.on("messages.upsert", selectionHandler);

  } catch (e) {
    console.error("Error:", e);
    await conn.sendMessage(from, {
      text: `❌ Error: ${e.message || "Unknown error"}`
    }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
