/** Tap the real Customily ATC on mobile and log every request until cart notification. */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';
const CPU_RATE = Number(process.env.ATC_CPU || 4);
const SHOT = path.join(__dirname, '..', 'debug-atc-tap.png');
const OUT = path.join(__dirname, '..', 'debug-atc-tap.json');

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

  let clickAt = 0;
  const log = [];
  const keep = /cart\/add|cart\.js|customily|amazonaws|cloudfront|storage/i;
  page.on('request', (r) => {
    if (!clickAt || !keep.test(r.url())) return;
    log.push({ p: 'req', rel: Date.now() - clickAt, m: r.method(), url: r.url().slice(0, 130) });
  });
  page.on('response', (r) => {
    if (!clickAt || !keep.test(r.url())) return;
    log.push({ p: 'res', rel: Date.now() - clickAt, s: r.status(), url: r.url().slice(0, 130) });
  });

  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[name^="properties["]', { timeout: 60000 });
  const input = page.locator('input[name^="properties["]').first();
  await input.scrollIntoViewIfNeeded();
  await input.tap();
  await page.evaluate(() => {
    const el = document.querySelector('input[name^="properties["]');
    if (!el) return;
    el.dataset.myprintsyUserEdit = '1';
    el.removeAttribute('readonly');
    el.disabled = false;
    el.focus();
  });
  await page.keyboard.type('ANNA', { delay: 90 });
  await input.dispatchEvent('change');
  await page.waitForTimeout(12000);

  const typed = await input.inputValue();
  console.log('typed value =', typed);

  const btn = page.locator('#customily-cart-btn');
  await btn.scrollIntoViewIfNeeded();
  clickAt = Date.now();
  await btn.tap();

  const notified = await page
    .waitForFunction(() => document.querySelector('cart-notification.active'), { timeout: 60000 })
    .then(() => true)
    .catch(() => false);
  const notifRel = Date.now() - clickAt;

  await page.screenshot({ path: SHOT, fullPage: false });

  const state = await page.evaluate(() => ({
    url: location.href,
    spinner: Boolean(document.querySelector('product-form .product-form__submit.loading')),
    error: document.querySelector('.product-form__error-message')?.textContent?.trim() || null,
    notifText: document.querySelector('cart-notification')?.textContent?.trim().slice(0, 120) || null,
  }));

  const out = { notified, notifRel, state, log };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
