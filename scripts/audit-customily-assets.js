/** Audit Customily template assets (size/bytes) + canvas resolution on a PDP. */
const { chromium } = require('playwright');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const assets = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (!/customily/i.test(url)) return;
    if (!/\.(png|jpe?g|webp|svg)/i.test(url)) return;
    let bytes = null;
    try {
      bytes = Number(res.headers()['content-length'] || 0) || (await res.body()).length;
    } catch (_) {}
    assets.push({ url: url.split('?')[0], bytes });
  });

  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(25000);

  const canvases = await page.evaluate(() =>
    Array.from(document.querySelectorAll('canvas')).map((c) => ({
      w: c.width,
      h: c.height,
      cssW: Math.round(c.getBoundingClientRect().width),
      cssH: Math.round(c.getBoundingClientRect().height),
      cls: String(c.className || '').slice(0, 60),
      pixels: c.width * c.height,
    }))
  );

  const imgs = await page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => /customily/i.test(i.currentSrc || i.src))
      .map((i) => ({
        natural: i.naturalWidth + 'x' + i.naturalHeight,
        shown: Math.round(i.width) + 'x' + Math.round(i.height),
        src: (i.currentSrc || i.src).split('?')[0].split('/').slice(-1)[0],
      }))
  );

  const byBytes = assets.sort((a, b) => (b.bytes || 0) - (a.bytes || 0));
  const total = assets.reduce((s, a) => s + (a.bytes || 0), 0);

  console.log('canvases:', JSON.stringify(canvases, null, 1));
  console.log('customily images in DOM:', JSON.stringify(imgs.slice(0, 20), null, 1));
  console.log('total customily image bytes:', Math.round(total / 1024) + ' KB across ' + assets.length + ' files');
  console.log(
    'heaviest:',
    JSON.stringify(
      byBytes.slice(0, 12).map((a) => ({ kb: Math.round((a.bytes || 0) / 1024), f: a.url.split('/').slice(-1)[0] })),
      null,
      1
    )
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
