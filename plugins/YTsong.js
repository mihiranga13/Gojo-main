const l = console.log;
const config = require('../settings');
const { cmd, commands } = require('../lib/command');
const yts = require("yt-search");
const ytdl = require("ytdl-core");
const fs = require("fs");
const path = require("path");

cmd(
  {
    pattern: "song",
    react: "🎵",
    desc: "Download Song",
    category: "download",
    filename: __filename,
  },
  async (
    robin,
    mek,
    m,
    {
      from,
      quoted,
      body,
      isCmd,
      command,
      args,
      q,
      isGroup,
      sender,
      senderNumber,
      botNumber2,
      botNumber,
      pushname,
      isMe,
      isOwner,
      groupMetadata,
      groupName,
      participants,
      groupAdmins,
      isBotAdmins,
      isAdmins,
      reply,
    }
  ) => {
    try {
      if (!q) return reply("*නමක් හරි ලින්ක් එකක් හරි දෙන්න* 🌚❤️");

      const search = await yts(q);
      const data = search.videos[0];
      const url = data.url;

      let desc = `
*❤️GOJO SONG DOWNLOADER❤️*

👻 *title* : ${data.title}
👻 *description* : ${data.description}
👻 *time* : ${data.timestamp}
👻 *ago* : ${data.ago}
👻 *views* : ${data.views}
👻 *url* : ${data.url}

𝐌𝐚𝐝𝐞 𝐛𝐲 𝐬𝐚𝐲𝐮𝐫𝐚
`;

      await robin.sendMessage(
        from,
        { image: { url: data.thumbnail }, caption: desc },
        { quoted: mek }
      );

      const durationParts = data.timestamp.split(":").map(Number);
      const totalSeconds =
        durationParts.length === 3
          ? durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]
          : durationParts[0] * 60 + durationParts[1];

      if (totalSeconds > 1800) {
        return reply("⏱️ audio limit is 30 minutes");
      }

      const filePath = path.join(__dirname, "../temp", `${Date.now()}.mp3`);
      const audioStream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });

      const writeStream = fs.createWriteStream(filePath);
      audioStream.pipe(writeStream);

      writeStream.on("finish", async () => {
        await robin.sendMessage(
          from,
          {
            audio: fs.readFileSync(filePath),
            mimetype: "audio/mpeg",
          },
          { quoted: mek }
        );

        await robin.sendMessage(
          from,
          {
            document: fs.readFileSync(filePath),
            mimetype: "audio/mpeg",
            fileName: `${data.title}.mp3`,
            caption: "𝐌𝐚𝐝𝐞 𝐛𝐲 𝐬𝐚𝐲𝐮𝐫𝐚",
          },
          { quoted: mek }
        );

        fs.unlinkSync(filePath); // Delete file after sending
        return reply("*Thanks for using my bot* 🌚❤️");
      });

    } catch (e) {
      console.log(e);
      reply(`❌ Error: ${e.message}`);
    }
  }
);
