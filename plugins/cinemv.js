const { cmd } = require("../lib/command");
const axios = require("axios");

// ────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────
const TZ_OFFSET = 5.5 * 60 * 60 * 1000; // +05:30

function getCurrentDateTime() {
  const now = new Date(Date.now() + TZ_OFFSET);
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return (
    `${days[now.getUTCDay()]}, ` +
    now.toISOString().replace("T", ", ").split(".")[0] +
    " +0530"
  );
}

async function searchMovies(query) {
  const url = `https://cinesubz-api-zazie.vercel.app/api/search?q=${encodeURIComponent(
    query
  )}`;
  try {
    const { data } = await axios.get(url, { timeout: 10_000 });
    const list = data?.result?.data ?? [];
    return list.slice(0, 10).map((m) => ({
      title: m.title || "Unknown Title",
      link: m.link || "",
      year: m.year || "N/A",
    }));
  } catch (e) {
    throw new Error(`CineSubz API error → ${e.message}`);
  }
}

async function getMovieDetails(movieUrl) {
  const api = `https://cinesubz-api-zazie.vercel.app/api/movie?url=${encodeURIComponent(
    movieUrl
  )}`;
  const { data } = await axios.get(api, { timeout: 10_000 });
  const m = data?.result?.data;
  if (!m) throw new Error("No movie data returned");
  if (!Array.isArray(m.dl_links) || m.dl_links.length === 0)
    throw new Error("No download links found");
  return {
    title: m.title || "Unknown Title",
    imdb: m.imdbRate || "N/A",
    date: m.date || "N/A",
    country: m.country || "N/A",
    runtime: m.duration || "N/A",
    image: m.image || "",
    dl_links: m.dl_links.map((l) => ({
      quality: l.quality || "Unknown",
      size: l.size || "Unknown",
      link: l.link || "",
    })),
  };
}

// ────────────────────────────────────────────────────────────
// state trackers
// ────────────────────────────────────────────────────────────
let cineConnRef = null;
/** message-ID ➜ search results */
const searchMap = {};
/** message-ID ➜ movieData */
const downloadMap = {};

// initialise once
if (!global.__cineReplyHandler) {
  global.__cineReplyHandler = true;
  const { setTimeout } = require("timers");
  (function wait() {
    if (!cineConnRef) return setTimeout(wait, 500);

    cineConnRef.ev.on("messages.upsert", async ({ messages = [] }) => {
      const msg = messages[0];
      if (!msg?.message) return;

      const text =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        "";
      if (!text.trim()) return;

      const quotedId =
        msg.message?.extendedTextMessage?.contextInfo?.stanzaId ?? null;

      /* ---------- stage 1 : user replied to search results ---------- */
      if (quotedId && searchMap[quotedId]) {
        const idx = Number(text.trim());
        const from = msg.key.remoteJid;
        if (!(idx > 0 && idx <= searchMap[quotedId].length)) {
          return cineConnRef.sendMessage(
            from,
            { text: "❌ *Invalid number. Try again!*" },
            { quoted: msg }
          );
        }

        // valid movie selected
        const movie = searchMap[quotedId][idx - 1];
        let movieData;
        try {
          cineConnRef.sendMessage(from, {
            react: { text: "⏳", key: msg.key },
          });
          movieData = await getMovieDetails(movie.link);
        } catch (e) {
          return cineConnRef.sendMessage(
            from,
            { text: `❌ *${e.message}*` },
            { quoted: msg }
          );
        }

        // build DL-links message
        let dlText = `🎥 *${movieData.title}*\n\n*Available Download Links:*\n`;
        movieData.dl_links.forEach((l, i) => {
          dlText += `*${i + 1}.* ${l.quality} – ${l.size}\n`;
        });
        dlText +=
          "\n📩 *Reply with the number of the quality you want to download.*";

        const sent = await cineConnRef.sendMessage(
          from,
          { text: dlText },
          { quoted: msg }
        );
        downloadMap[sent.key.id] = movieData;
        return;
      }

      /* ---------- stage 2 : user replied to download-links message ---------- */
      if (quotedId && downloadMap[quotedId]) {
        const idx = Number(text.trim());
        const movieData = downloadMap[quotedId];
        const from = msg.key.remoteJid;

        if (!(idx > 0 && idx <= movieData.dl_links.length)) {
          return cineConnRef.sendMessage(
            from,
            { text: "❌ *Invalid number. Try again!*" },
            { quoted: msg }
          );
        }

        const linkObj = movieData.dl_links[idx - 1];
        await cineConnRef.sendMessage(from, {
          react: { text: "⬇️", key: msg.key },
        });

        const caption = `
🎬 *GOJO MD CINEMA*
────────────────────────
🎞 *Movie*   : _${movieData.title}_
⭐ *IMDb*    : _${movieData.imdb}_
📅 *Date*    : _${movieData.date}_
🌍 *Country* : _${movieData.country}_
⏳ *Runtime* : _${movieData.runtime}_
────────────────────────
© 2025 GOJO MD | Powered by Sayura`.trim();

        await cineConnRef.sendMessage(
          from,
          {
            document: { url: linkObj.link },
            mimetype: "video/mp4",
            fileName: `${movieData.title} - ${linkObj.quality}.mp4`,
            caption,
            contextInfo: {
              externalAdReply: {
                title: movieData.title,
                body: "🎬 GOJO CINEMA",
                mediaType: 1,
                thumbnailUrl: movieData.image,
                sourceUrl: movieData.image,
                renderLargerThumbnail: true,
              },
            },
          },
          { quoted: msg }
        );
        await cineConnRef.sendMessage(from, {
          react: { text: "✅", key: msg.key },
        });
      }
    });
  })();
}

// ────────────────────────────────────────────────────────────
// main command
// ────────────────────────────────────────────────────────────
cmd(
  {
    pattern: "cine",
    alias: ["subfilm"],
    react: "🎬",
    desc: "Search and download movies from CineSubz",
    category: "movie",
    filename: __filename,
  },
  async (conn, mek, m, { from, q, reply }) => {
    try {
      cineConnRef = conn; // save for global handler

      const query = q?.trim();
      if (!query) {
        return reply(
          "*Please provide a movie name to search!*  (e.g. `.cine Deadpool`)"
        );
      }

      // 1️⃣ search
      const results = await searchMovies(query);
      if (results.length === 0)
        return reply(`*Nothing found for:* _${query}_`);

      // 2️⃣ send results
      let msg = `✨ *GOJO MD MOVIE DOWNLOADER* ✨\n\n`;
      msg += `🎥 *Search Results for* _"${query}"_ (${getCurrentDateTime()})\n\n`;
      results.forEach((r, i) => {
        msg += `*${i + 1}.* ${r.title} (${r.year})\n`;
      });
      msg +=
        "\n📩 *Reply with the number of the movie you want to download.*";

      const sent = await conn.sendMessage(from, { text: msg }, { quoted: mek });
      searchMap[sent.key.id] = results;
    } catch (e) {
      console.error(e);
      reply(
        `*An error occurred while processing your request:* ${e.message}\n` +
          "*Try again later.*"
      );
    }
  }
);
