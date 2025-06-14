const { cmd } = require("../lib/command");
const os = require('os');
const packageJson = require('../package.json');
cmd(
  {
    pattern: "system",
    react: "☢️",
    fromMe: true,
    desc: "Get system information",
    type: "info",
  },
  async (message, match, client) => {
const start = new Date().getTime();
await client.sendMessage(message.jid, { text: 'Checking...' }, { quoted: message.data });
const end = new Date().getTime();
const responseTime = ((end - start) / 1000).toFixed(3);

const uptimeSec = os.uptime();
const sysDays = Math.floor(uptimeSec / (3600 * 24));
const sysHours = Math.floor((uptimeSec % (3600 * 24)) / 3600);
const sysMinutes = Math.floor((uptimeSec % 3600) / 60);
const sysSeconds = Math.floor(uptimeSec % 60);
const sysUptime = `${sysDays}d ${sysHours}h ${sysMinutes}m ${sysSeconds}s`;

const runtimeSec = Math.floor(process.uptime());
const runDays = Math.floor(runtimeSec / (3600 * 24));
const runHours = Math.floor((runtimeSec % (3600 * 24)) / 3600);
const runMinutes = Math.floor((runtimeSec % 3600) / 60);
const runSeconds = Math.floor(runtimeSec % 60);
const runtime = `${runDays}d ${runHours}h ${runMinutes}m ${runSeconds}s`;

const platform = os.platform();
const arch = os.arch();
const cpus = os.cpus().length;
const cpuModel = os.cpus()[0].model;
const cpuSpeed = os.cpus()[0].speed;
const loadAvg = os.loadavg().map(avg => avg.toFixed(2)).join(" / ");

const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);
const freeMem = (os.freemem() / 1024 / 1024).toFixed(0);
const usedMem = totalMem - freeMem;
const memUsage = process.memoryUsage();
const rssMB = (memUsage.rss / 1024 / 1024).toFixed(2);
const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
const heapTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);

const nodeVersion = process.version;
const version = packageJson.version || 'N/A';
const pid = process.pid;
const ppid = process.ppid;
const activeHandles = process._getActiveHandles().length;
const lastRestart = new Date(Date.now() - process.uptime() * 1000).toLocaleString();

const hostname = os.hostname();
const isRender = hostname.startsWith('srv-');
const isKoyeb = hostname.length === 8 && /^[a-f0-9]+$/.test(hostname);
const hostPlatform = isRender ? 'Render' : isKoyeb ? 'Koyeb' : 'Unknown';

const text = `
╭───[ Izumi System Info ]
│
│ Platform       : ${platform}
│ Architecture   : ${arch}
│ Host Platform  : ${hostPlatform}
│ CPU Cores      : ${cpus}
│ CPU Model      : ${cpuModel}
│ Load Average   : ${loadAvg}
│
├─ Memory
│ Used RAM       : ${usedMem} / ${totalMem} MB
│ Heap Used      : ${heapUsed} / ${heapTotal} MB
│ RSS Memory     : ${rssMB} MB
│
├─ Status
│ System Uptime  : ${sysUptime}
│ Runtime        : ${runtime}
│ Response Time  : ${responseTime} sec
│ Last Restart   : ${lastRestart}
│
├─ Process Info
│ Node.js        : ${nodeVersion}
│ Bot Version    : ${version}
│ PID / PPID     : ${pid} / ${ppid}
│ Active Handles : ${activeHandles}
╰────────────────────`;

await client.sendMessage(
  message.jid,
  {
    
    caption: text,
    gifPlayback: true,
    contextInfo: {
      forwardingScore: 1,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterName: "𝐆𝐎𝐉𝐎 𝐌𝐃",
        serverMessageId: -1
      }
    }
  },
  { quoted: message.data }
)
});