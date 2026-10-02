/**
 * Measure PDP load: theme vs Customily vs third-party.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/make-it-happen-personalized-tumbler-cup-scthth1l14';
const OUT = path.join(__dirname, '..', 'debug-pdp-load.json');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  }).then((c) => c.newPage());

  const reqs = [];
  page.on('response', async (res) => {
    const req = res.request();
    const url = res.url();
    let timing = null;
    try {
      timing = req.timing();
    } catch (_) {}
    reqs.push({
      url: url.slice(0, 160),
      status: res.status(),
      type: req.resourceType(),
      responseEnd: timing && timing.responseEnd,
      startTime: timing && timing.startTime,
    });
  });

  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  const dclAt = Date.now() - t0;

  await page.waitForLoadState('load').catch(() => {});
  const loadAt = Date.now() - t0;

  // Wait for Customily ATC button (interactive personalization ready)
  let customilyReadyMs = null;
  try {
    await page.waitForSelector('#customily-cart-btn, .customily-preview-button', {
      timeout: 60000,
      state: 'visible',
    });
    customilyReadyMs = Date.now() - t0;
  } catch (_) {
    customilyReadyMs = null;
  }

  // Extra settle for late requests
  await page.waitForTimeout(5000);
  const settleAt = Date.now() - t0;

  const nav = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const bucket = (url) => {
      if (/customily|s3\.us-west.*customily/i.test(url)) return 'customily';
      if (/googletagmanager|google-analytics|g\/collect|facebook|klaviyo|hotjar|clarity|tiktok|pinterest|snap|doubleclick|web-pixel/i.test(url))
        return 'analytics';
      if (/cdn\.shopify|myshopify|myprintsy\.com\/cdn|shopifycloud/i.test(url)) return 'shopify_theme';
      if (/fonts\.|typekit|googleapis\.com\/css/i.test(url)) return 'fonts';
      return 'other';
    };
    const by = { customily: [], analytics: [], shopify_theme: [], fonts: [], other: [] };
    resources.forEach((r) => {
      const b = bucket(r.name);
      by[b].push({
        name: r.name.slice(0, 120),
        duration: Math.round(r.duration),
        transferSize: r.transferSize || 0,
        initiatorType: r.initiatorType,
      });
    });
    const sum = (arr) => ({
      count: arr.length,
      durationMax: arr.reduce((m, x) => Math.max(m, x.duration), 0),
      transferKB: Math.round(arr.reduce((s, x) => s + x.transferSize, 0) / 1024),
      top: [...arr].sort((a, b) => b.duration - a.duration).slice(0, 8),
    });
    return {
      nav: n
        ? {
            dcl: Math.round(n.domContentLoadedEventEnd),
            load: Math.round(n.loadEventEnd),
            responseStart: Math.round(n.responseStart),
            domInteractive: Math.round(n.domInteractive),
            transferSize: n.transferSize,
          }
        : null,
      buckets: {
        customily: sum(by.customily),
        analytics: sum(by.analytics),
        shopify_theme: sum(by.shopify_theme),
        fonts: sum(by.fonts),
        other: sum(by.other),
      },
      customilyBtn: Boolean(document.getElementById('customily-cart-btn')),
      previewBtn: Boolean(document.querySelector('.customily-preview-button')),
      hasLdOver: Boolean(document.querySelector('.ld-over-inverse, .ld-over')),
    };
  });

  const result = {
    url: URL,
    wall: { dclAt, loadAt, customilyReadyMs, settleAt },
    nav,
    reqCount: reqs.length,
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
