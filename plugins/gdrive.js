const fs = require('fs');
const { google } = require('googleapis');
const { cmd } = require('../lib/command');
const config = require('../settings');

// Max file size: 1 GB
const MAX_SIZE_BYTES = 1024 * 1024 * 1024;

// Format file size
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Extract file ID from URL or raw ID
function extractFileId(input) {
  if (/^[\w-]{15,}$/.test(input)) return input; // Raw ID
  const match = input.match(/(?:\/d\/|id=)([\w-]{10,})/);
  return match ? match[1] : null;
}

// Get Google Drive client using service account
async function getDriveClient() {
  if (!process.env.GDRIVE_SERVICE_ACCOUNT_KEY) {
    throw new Error('No service-account key found in env var GDRIVE_SERVICE_ACCOUNT_KEY');
  }
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GDRIVE_SERVICE_ACCOUNT_KEY),
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

// Main command
cmd({
  pattern: 'gdrive',
  alias: ['googledrive'],
  react: '📥',
  desc: 'Download Google Drive files (public or shared with bot)',
  category: 'download',
  filename: __filename,
}, async (conn, mek, m, { from, q, prefix, pushName }) => {
  if (!q) {
    return conn.sendMessage(from, {
      text: `❌ Provide a Google Drive link or ID.\nEx: ${prefix}gdrive https://drive.google.com/file/d/FILE_ID/view`
    }, { quoted: mek });
  }

  const fileId = extractFileId(q.trim());
  if (!fileId) {
    return conn.sendMessage(from, { text: '❌ Could not extract file ID from the input.' }, { quoted: mek });
  }

  try {
    const drive = await getDriveClient();
    const meta = await drive.files.get({ fileId, fields: 'name,size,mimeType' });
    const { name, size, mimeType } = meta.data;

    if (size && Number(size) > MAX_SIZE_BYTES) {
      return conn.sendMessage(from, {
        text: `⚠️ File too large (${formatBytes(size)}). Max allowed: ${(MAX_SIZE_BYTES / 1e6)} MB.`,
      }, { quoted: mek });
    }

    // Stream file directly to WhatsApp
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });

    await conn.sendMessage(from, {
      document: res.data,
      fileName: name,
      mimetype: mimeType || 'application/octet-stream',
      caption: `📁 *${name}*\n📦 ${size ? formatBytes(size) : 'Unknown'}\nDownloaded for ${pushName}`,
    }, { quoted: mek });

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (err) {
    console.error('GDrive error:', err);
    const msg = err.message.includes('No service-account')
      ? '❌ Missing GDRIVE_SERVICE_ACCOUNT_KEY environment variable (set your Google Service Account key).'
      : `❌ Download failed: ${err.message}`;
    await conn.sendMessage(from, { text: msg }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
  }
});
