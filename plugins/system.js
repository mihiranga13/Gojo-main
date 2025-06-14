const { cmd } = require("../lib/command");
const os = require("os");

cmd(
  {
    pattern: "system",
    alias: ["status", "botinfo"],
    desc: "Check uptime, RAM, CPU, Node version, etc.",
    category: "main",
    react: "💻",
    filename: __filename,
  },
  async (
    conn,
    mek,
    m,
    {
      reply,
      /* the other params you already destructure … */,
    }
  ) => {
    try {
      // ─── helpers ──────────────────────────────────────────────
      const prettyBytes = (b) => `${(b / 1024 / 1024).toFixed(2)} MB`;
      const formatDuration = (s) => {
        const pad = (n) => String(n).padStart(2, "0");
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const d = Math.floor(h / 24);
        return `${d ? d + "d " : ""}${pad(h % 24)}:${pad(m)}:${pad(
          Math.floor(s % 60)
        )}`;
      };

      // ─── stats ────────────────────────────────────────────────
      const mem = process.memoryUsage();
      const totalMem = os.totalmem();
      const cpus = os.cpus();
      const cpuModel = cpus[0]?.model.trim() || "Unknown CPU";
      const cpuSpeed = cpus[0]?.speed || 0;

      const status = `╭━━〔 *GOJO ᴍᴅ* 〕━━┈⊷
┃◈╭─────────────·๏
┃◈┃• *⏳ Uptime*      : ${formatDuration(process.uptime())}
┃◈┃• *📟 RAM*         : ${prettyBytes(mem.rss)} / ${prettyBytes(totalMem)}
┃◈┃• *⚙️ OS*           : ${os.type()} ${os.release()} (${os.arch()})
┃◈┃• *🖥️ CPU*          : ${cpuModel} @${cpuSpeed} MHz (${cpus.length} cores)
┃◈┃• *🔖 Node Ver.*   : ${process.version}
┃◈┃• *👨‍💻 Owner*       : ᴏꜰꜰɪᴄɪᴀʟ GOJO MD
┃◈└───────────┈⊷
╰──────────────┈⊷

> 𝐏𝙾𝚆𝙴𝚁𝙳 𝐁𝚈 ᴏꜰꜰɪᴄɪᴀʟ GOJO ᴍᴅ`;

      return reply(status);
    } catch (e) {
      console.error(e);
      return reply(String(e));
    }
  }
);
