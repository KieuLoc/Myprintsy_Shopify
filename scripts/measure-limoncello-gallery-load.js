/**
 * Measure when main gallery image becomes visible on mobile PDP.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-sun-kissed-limoncello-personalized-accent-mug-upthth1l21';
const CPU_RATE = Number(process.env.ATC_CPU || 4);
const OUT = path.join(__dirname, '..', 'debug-limoncello-load.json');
const SHOT = path.join(__dirname, '..', 'debug-limoncello-load.png');

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
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });

  const t0 = Date.now();
  const marks = [];
  const mark = (m, data) => marks.push({ m, rel: Date.now() - t0, ...(data || {}) });

  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  mark('domcontentloaded');

  let firstMainReady = null;
  let firstThumbReady = null;
  let last = null;

  for (let i = 0; i < 50; i++) {
    const snap = await page.evaluate(() => {
      const mains = Array.from(
        document.querySelectorAll(
          '.product-media-container img, .product__media img, media-gallery img, .media img'
        )
      );
      const main =
        mains.find((img) => {
          const r = img.getBoundingClientRect();
          return r.width > 80 && r.height > 80;
        }) || mains[0];
      const thumbs = Array.from(
        document.querySelectorAll('.thumbnail img, .thumbnail-list img, button.thumbnail img')
      );
      const canvas = document.querySelector('canvas');
      const rect = main ? main.getBoundingClientRect() : null;
      const cs = main ? getComputedStyle(main) : null;
      return {
        mainSrc: main ? (main.currentSrc || main.src || '').slice(0, 140) : null,
        mainComplete: !!(main && main.complete && main.naturalWidth > 20),
        mainNatural: main ? [main.naturalWidth, main.naturalHeight] : null,
        mainBox: rect ? [Math.round(rect.width), Math.round(rect.height)] : null,
        mainVisible: !!(
          rect &&
          rect.width > 80 &&
          rect.height > 80 &&
          cs &&
          cs.opacity !== '0' &&
          cs.visibility !== 'hidden' &&
          cs.display !== 'none'
        ),
        thumbReady: thumbs.filter((t) => t.complete && t.naturalWidth > 0).length,
        thumbTotal: thumbs.length,
        hasCanvas: !!canvas,
        canvasBox: canvas
          ? (() => {
              const r = canvas.getBoundingClientRect();
              return [Math.round(r.width), Math.round(r.height)];
            })()
          : null,
      };
    });

    last = snap;
    if (!firstThumbReady && snap.thumbReady >= 1) {
      firstThumbReady = Date.now() - t0;
      mark('firstThumbReady', snap);
    }
    if (!firstMainReady && snap.mainComplete && snap.mainVisible) {
      firstMainReady = Date.now() - t0;
      mark('firstMainReady', snap);
      break;
    }
    if (i % 4 === 0) mark('poll', snap);
    await page.waitForTimeout(500);
  }

  await page.screenshot({ path: SHOT, fullPage: false });
  const out = {
    product: PRODUCT,
    cpuThrottle: CPU_RATE,
    firstThumbReadyMs: firstThumbReady,
    firstMainReadyMs: firstMainReady,
    last,
    marks,
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
