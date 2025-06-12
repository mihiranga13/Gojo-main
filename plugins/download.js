const { cmd } = require('../lib/command');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

cmd(
  {
    pattern: "download",
    desc: "Download file from direct link (Puppeteer)",
    category: "download",
    react: "🔰",
    filename: __filename,
  },
  async (robin, mek, m, { from, q, reply }) => {
    if (!q) return reply("*🔗 Direct link එකක් දාන්න!*");

    await reply("🕐 *File එක Download වෙමින් පවතී...* Puppeteer use කරමින්");

    try {
      const fileName = path.basename(q.split("?")[0]) || "downloaded_file";

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
      });
      const page = await browser.newPage();

      // Set User-Agent to mimic a real browser
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0"
      );

      // Navigate to the URL
      const response = await page.goto(q, { waitUntil: "networkidle2" });

      if (!response || !response.ok()) {
        await browser.close();
        return reply("❌ *Download link එක සම්බන්ධ වෙන්න බැරි වුණා!* Status: " + (response?.status() || "No response"));
      }

      // Get buffer from response
      const buffer = await response.buffer();

      // Save file temporarily
      const tempPath = path.join(__dirname, "..", "tmp", fileName);

      fs.writeFileSync(tempPath, buffer);

      await browser.close();

      // Send file to user
      await robin.sendMessage(
        from,
        {
          document: fs.readFileSync(tempPath),
          fileName: fileName,
          mimetype: response.headers()['content-type'] || 'application/octet-stream',
          caption: `✅ *File Downloaded Successfully!*

📂 *File Name:* ${fileName}

🔗 *Source:* ${q}

┏━━━━━━━━━━━━━━┓
┃   ⚡ *Powered by Sayura* ⚡
┗━━━━━━━━━━━━━━┛`,
        },
        { quoted: mek }
      );

      // Delete temp file
      fs.unlinkSync(tempPath);

    } catch (e) {
      console.error("PUPPETEER DOWNLOAD ERROR:", e);
      reply("❌ *Download කිරීමේදී දෝෂයක් සිදු විය!*");
    }
  }
);
