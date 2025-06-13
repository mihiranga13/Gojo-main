const fetch = require('node-fetch');
const { sizeFormatter } = require('human-readable');

const formatSize = sizeFormatter({
  std: 'JEDEC',
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (n, symbol) => `${n} ${symbol}B`
});

/**
 * Download‐info extractor for **public Google-Drive links**.
 * • Handles normal links, “virus-scan / download-anyway” confirm-token pages
 * • Detects quota-exceeded / permission errors and returns a clear message
 */
async function GDriveDl (url) {
  const out = { error: true };

  // 1️⃣ basic validation
  if (!url || !/drive\.google/i.test(url)) return out;
  const id = (url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]+)/) || [])[1];
  if (!id) return out;

  // helper to fetch without auto‐following – we need the raw HTML first
  const _fetch = (u, opts = {}) =>
    fetch(u, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0' }, ...opts });

  try {
    // 2️⃣ first attempt – small files usually redirect straight away
    let res = await _fetch(`https://drive.google.com/uc?export=download&id=${id}`);
    // Google sometimes replies with a 302 to a `googleusercontent` URL → ready to download
    if (res.status === 302 && res.headers.get('location')) {
      const dl = res.headers.get('location');
      const head = await _fetch(dl, { method: 'HEAD' });
      return {
        error: false,
        downloadUrl: dl,
        fileName: decodeURIComponent((head.headers.get('content-disposition') || '')
                    .replace(/.*filename\*?=(?:UTF-8'')?([^;]+)/i, '$1')) || 'Unknown',
        fileSize: formatSize(Number(head.headers.get('content-length') || 0)),
        mimetype: head.headers.get('content-type') || 'application/octet-stream'
      };
    }

    // 3️⃣ if we’re here, we got an HTML page – may contain confirm token or quota message
    const html = await res.text();

    // quota-exceeded detection
    if (/quota exceeded|download quotas|too many users/i.test(html)) {
      throw new Error('Link blocked - Google-Drive quota exceeded.');
    }

    // extract confirm token (download_warning) from HTML
    const tokenMatch = html.match(/confirm=([0-9A-Za-z-_]+)&/);
    if (!tokenMatch) throw new Error('Unable to retrieve confirm token.');

    const confirm = tokenMatch[1];
    const downloadURL =
      `https://drive.google.com/uc?export=download&confirm=${confirm}&id=${id}`;

    // 4️⃣ final HEAD request to get meta info and verify
    const head = await _fetch(downloadURL, { method: 'HEAD' });
    if (head.status !== 200) throw new Error(`Download failed: ${head.statusText}`);

    return {
      error: false,
      downloadUrl: downloadURL,
      fileName: decodeURIComponent((head.headers.get('content-disposition') || '')
                  .replace(/.*filename\*?=(?:UTF-8'')?([^;]+)/i, '$1')) || 'Unknown',
      fileSize: formatSize(Number(head.headers.get('content-length') || 0)),
      mimetype: head.headers.get('content-type') || 'application/octet-stream'
    };
  } catch (e) {
    console.error('[GDriveDl Error]', e.message);
    return { error: true, message: e.message };
  }
}

module.exports = GDriveDl;
