/** Print full URLs + pixel dimensions of Customily template images used on a PDP. */
const { chromium } = require('playwright');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';

/** Minimal JPEG/PNG/WebP header parser. */
function readDims(buf) {
  if (buf.length > 24 && buf.toString('ascii', 1, 4) === 'PNG') {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20), type: 'png' };
  }
  if (buf.length > 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    return { w: null, h: null, type: 'webp' };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length - 9) {
      if (buf[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7), type: 'jpeg' };
      }
      i += 2 + len;
    }
  }
  return { w: null, h: null, type: 'unknown' };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const found = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (!/customily/i.test(url) || !/\.(png|jpe?g|webp)/i.test(url)) return;
    try {
      const body = await res.body();
      found.push({ url, kb: Math.round(body.length / 1024), ...readDims(body) });
    } catch (_) {}
  });

  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(25000);

  found
    .sort((a, b) => b.kb - a.kb)
    .forEach((f) => console.log(`${String(f.kb).padStart(4)} KB  ${f.w}x${f.h}  ${f.type}  ${f.url}`));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
