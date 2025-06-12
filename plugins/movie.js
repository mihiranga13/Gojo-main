const l = console.log
const config = require('../settings')
const { cmd, commands } = require('../lib/command')  
const axios = require('axios');
const NodeCache = require('node-cache');


const searchCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

cmd({
  pattern: "film",
  react: "🎬",
  desc: "Search and download movies",
  category: "media",
  filename: __filename,
}, async (conn, mek, m, { from, q, pushname }) => {
  if (!q) {
    await conn.sendMessage(from, {
      text: `*🎬 Movie Search*\n\n📋 Usage: .film <movie name>\n📝 Example: .film Deadpool\n\n💡 Reply 'done' to stop the process`
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
          const searchResponse = await axios.get(searchUrl, { timeout: 10000 });
          searchData = searchResponse.data;
          break;
        } catch (error) {
          retries--;
          if (retries === 0) throw new Error("Failed to retrieve movie data");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!searchData.status || !searchData.results || searchData.results.length === 0) {
        throw new Error("No movies found");
      }

      searchCache.set(cacheKey, searchData);
    }

    
    let filmList = `*🎬 MOVIE SEARCH RESULTS*\n\n`;
    const films = searchData.results.map((film, index) => ({
      number: index + 1,
      title: film.title,
      imdb: film.imdb,
      year: film.year,
      link: film.link,
      image: film.image
    }));

    films.forEach(film => {
      filmList += `🎥 ${film.number}. *${film.title}*\n`;
      filmList += `   ⭐ IMDB: ${film.imdb}\n`;
      filmList += `   📅 Year: ${film.year}\n\n`;
    });
    filmList += `🔢 Select a movie: Reply with the number\n`;
    filmList += `❌ Reply 'done' to stop`;

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
          text: `*✅ Process Completed*\n\n👋 Movie search ended!\nUse .film <movie name> to search again.`
        }, { quoted: message });
        return;
      }

      
      if (repliedToId === movieListMessageKey.id) {
        const selectedNumber = parseInt(replyText);
        const selectedFilm = films.find(film => film.number === selectedNumber);

        if (!selectedFilm) {
          await conn.sendMessage(from, {
            text: `*❌ Invalid Selection*\n\nPlease choose a valid movie number from the list.`
          }, { quoted: message });
          return;
        }

        
        if (!selectedFilm.link || !selectedFilm.link.startsWith('http')) {
          await conn.sendMessage(from, {
            text: `*❌ Invalid Link*\n\nThis movie link is not available. Please select another movie.`
          }, { quoted: message });
          return;
        }

        
        const downloadUrl = `https://apis.davidcyriltech.my.id/movies/download?url=${encodeURIComponent(selectedFilm.link)}`;
        let downloadData;
        let downloadRetries = 3;

        while (downloadRetries > 0) {
          try {
            const downloadResponse = await axios.get(downloadUrl, { timeout: 10000 });
            downloadData = downloadResponse.data;
            console.log('API response:', JSON.stringify(downloadData, null, 2));
            if (!downloadData.status || !downloadData.movie || !downloadData.movie.download_links) {
              throw new Error("Invalid API response: Missing status or download links");
            }
            break;
          } catch (error) {
            console.error(`Download API error: ${error.message}, Retries left: ${downloadRetries}`);
            downloadRetries--;
            if (downloadRetries === 0) {
              await conn.sendMessage(from, {
                text: `*❌ Download Error*\n\nFailed to fetch download links: ${error.message}\nPlease try another movie.`
              }, { quoted: message });
              return;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        const downloadLinks = [];
        const allLinks = downloadData.movie.download_links;

        const sdLink = allLinks.find(link => link.quality === "SD 480p" && link.direct_download);
        if (sdLink) {
          downloadLinks.push({
            number: 1,
            quality: "SD Quality",
            size: sdLink.size,
            url: sdLink.direct_download
          });
        }

        let hdLink = allLinks.find(link => link.quality === "HD 720p" && link.direct_download);
        if (!hdLink) {
          hdLink = allLinks.find(link => link.quality === "FHD 1080p" && link.direct_download);
        }
        if (hdLink) {
          downloadLinks.push({
            number: 2,
            quality: "HD Quality",
            size: hdLink.size,
            url: hdLink.direct_download
          });
        }

        if (downloadLinks.length === 0) {
          await conn.sendMessage(from, {
            text: `*❌ No Downloads Available*\n\nNo SD or HD quality links available for this movie.\nPlease try another movie.`
          }, { quoted: message });
          return;
        }

        let downloadOptions = `*🎬 ${selectedFilm.title}*\n\n`;
        downloadOptions += `*📥 Choose Quality:*\n\n`;
        downloadLinks.forEach(link => {
          downloadOptions += `${link.number}. *${link.quality}* (${link.size})\n`;
        });
        downloadOptions += `\n🔢 Select quality: Reply with the number\n`;
        downloadOptions += `❌ Reply 'done' to stop`;

        const downloadMessage = await conn.sendMessage(from, {
          image: { url: downloadData.movie.thumbnail || selectedFilm.image || "https://via.placeholder.com/400x600/333/fff?text=Movie" },
          caption: downloadOptions
        }, { quoted: message });

       
        downloadOptionsMap.set(downloadMessage.key.id, { film: selectedFilm, downloadLinks });
      }
      
      else if (downloadOptionsMap.has(repliedToId)) {
        const { film, downloadLinks } = downloadOptionsMap.get(repliedToId);
        const selectedQualityNumber = parseInt(replyText);
        const selectedLink = downloadLinks.find(link => link.number === selectedQualityNumber);

        if (!selectedLink) {
          await conn.sendMessage(from, {
            text: `*❌ Invalid Selection*\n\nPlease choose a valid quality number from the list.`
          }, { quoted: message });
          return;
        }

 
        const sizeStr = selectedLink.size.toLowerCase();
        let sizeInGB = 0;
        if (sizeStr.includes("gb")) {
          sizeInGB = parseFloat(sizeStr.replace("gb", "").trim());
        } else if (sizeStr.includes("mb")) {
          sizeInGB = parseFloat(sizeStr.replace("mb", "").trim()) / 1024;
        }

        if (sizeInGB > 2) {
          await conn.sendMessage(from, {
            text: `*⚠️ File Too Large*\n\nFile size: ${selectedLink.size}\nThis file is too large to send directly.\n\n*Direct Download Link:*\n${selectedLink.url}\n\nTry selecting a smaller quality option.`
          }, { quoted: message });
          return;
        }

  
        try {
          await conn.sendMessage(from, {
            document: { url: selectedLink.url },
            mimetype: "video/mp4",
            fileName: `${film.title} - ${selectedLink.quality}.mp4`,
            caption: `*🎬 ${film.title}*\n\n📱 Quality: ${selectedLink.quality}\n📊 Size: ${selectedLink.size}\n\n✅ Download completed successfully!`
          }, { quoted: message });

          await conn.sendMessage(from, { react: { text: "✅", key: message.key } });
        } catch (downloadError) {
          await conn.sendMessage(from, {
            text: `*❌ Download Error*\n\nError: ${downloadError.message}\n\n*Direct Download Link:*\n${selectedLink.url}\n\nPlease try again or use the direct link.`
          }, { quoted: message });
        }
      }
    };

    
    conn.ev.on("messages.upsert", selectionHandler);

  } catch (e) {
    console.error("Error:", e);
    await conn.sendMessage(from, {
      text: `*❌ Error Occurred*\n\nError: ${e.message || "Something went wrong"}\n\nPlease try again later.`
    }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
