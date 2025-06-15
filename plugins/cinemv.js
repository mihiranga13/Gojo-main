const { cmd } = require("../lib/command");
const axios = require("axios");

const cineBase = 'https://www.cinesubz.co';
const cineAPI = 'https://dark-yasiya-api.site/api/cinesubz';

cmd({
  pattern: "film",
  alias: ["film", "cine", "cinemv"],
  category: "movie",
  desc: "Download Sinhala movies from cinesubz.co",
  use: ".film <movie name>",
}, async (client, msg, text, { args }) => {
  if (!text) return await msg.reply("🎬 සෙවීමට චිත්‍රපට නාමය ඇතුළත් කරන්න. උදා: `.film Pravegaya`");

  try {
    await msg.react("🎥");
    const search = await axios.get(`${cineAPI}/search?query=${encodeURIComponent(text)}`);
    const results = search.data.result;

    if (!results || results.length === 0) {
      return await msg.reply("😓 චිත්‍රපටයක් හමු නොවීය.");
    }

    const movie = results[0];
    const moviePage = await axios.get(`${cineAPI}/details/${movie.id}`);
    const movieData = moviePage.data.result;

    let caption = `🎬 *${movieData.title}*\n\n`;
    caption += `📅 Year: ${movieData.year || "N/A"}\n`;
    caption += `🧬 Genres: ${movieData.genres?.join(', ') || "N/A"}\n`;
    caption += `🎭 Cast: ${movieData.cast?.join(', ') || "N/A"}\n`;
    caption += `📝 Description: ${movieData.description || "No description"}\n\n`;
    caption += `📥 Select a download option:\n`;

    movieData.dl_links.forEach((link, index) => {
      caption += `\n${index + 1}. ${link.label} - ${link.size}`;
    });

    await client.sendMessage(msg.from, {
      image: { url: movieData.poster },
      caption: caption + `\n\n📝 Reply with a number (1-${movieData.dl_links.length}) to download.`,
    }, { quoted: msg });

    client.downloadListener = async (res, numberText) => {
      const index = parseInt(numberText.trim()) - 1;
      if (isNaN(index) || index < 0 || index >= movieData.dl_links.length) {
        return client.sendMessage(msg.from, { text: "❌ Invalid number. Try again." }, { quoted: res });
      }

      const chosen = movieData.dl_links[index];
      let linkAlive = false;

      try {
        await axios.head(chosen.link, { timeout: 5000 });
        linkAlive = true;
      } catch (_) {
        linkAlive = false;
      }

      if (linkAlive) {
        await client.sendMessage(msg.from, {
          document: { url: chosen.link },
          fileName: `${movieData.title}-${chosen.label}.mp4`,
          mimetype: "video/mp4",
          caption: `🎬 ${movieData.title} (${chosen.label})\n📥 ${chosen.size}`,
        }, { quoted: res });
      } else {
        await client.sendMessage(msg.from, {
          text: `⚠️ Cannot auto-download. Click below to download manually:\n\n${chosen.link}`,
          linkPreview: false,
        }, { quoted: res });
      }
    };
  } catch (e) {
    console.error(e);
    return await msg.reply("❌ දෝෂයක් සිදුවී ඇත. නැවත උත්සාහ කරන්න.");
  }
});
