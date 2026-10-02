/**
 * Live check (DEV preview): change the personalization name, add to cart again, and the popup must
 * show the NEW preview right away — the mobile bug was it re-showing the previous name because
 * Customily replaces the theme gallery with its own slider there.
 *
 * Runs the shopper flow twice per viewport: type name -> Add to cart -> read popup image -> close.
 * Round 2 must produce a DIFFERENT image than round 1 (fresh render), on mobile and desktop.
 *
 *   node scripts/check-atc-popup-name-change.js
 *   PREVIEW_THEME_ID=183186358588 node scripts/check-atc-popup-name-change.js   # against LIVE
 *
 * Limitation: Shopify blocks automated /cart/add (200 with empty body, no cart cookie), so this
 * asserts the popup image the shopper sees, not cart persistence.
 */
const assert = require('assert');
const { chromium, devices } = require('playwright');

const PRODUCT =
  process.env.PRODUCT_URL ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-upthah2e13';
const THEME = process.env.PREVIEW_THEME_ID || '186878558524';
const URL = `${PRODUCT}?preview_theme_id=${THEME}`;

const HIDE_OVERLAYS = `
  const s = document.createElement('style');
  s.textContent = 'welcome-popup,welcome-step2-popup,cart-reminder-popup,success-opt-in-popup,.shopify-pc__banner,#shopify-pc__banner{display:none!important;pointer-events:none!important}';
  document.documentElement.appendChild(s);`;

const label = (src) => (String(src).startsWith('data:') ? `canvas(${src.length})` : String(src).slice(-58));

async function typeName(page, value) {
  const ok = await page.evaluate((v) => {
    const el = document.querySelector('.customily_option input[type="text"], #customily-options input[type="text"]');
    if (!el) return false;
    el.removeAttribute('readonly');
    el.removeAttribute('disabled');
    el.focus();
    el.value = v;
    ['input', 'change', 'keyup', 'blur'].forEach((e) => el.dispatchEvent(new Event(e, { bubbles: true })));
    return true;
  }, value);
  assert.ok(ok, 'no Customily text input on the page');
  await page.waitForTimeout(7000); // Customily re-renders the canvas
}

async function answerRequiredOptions(page) {
  await page.evaluate(() => {
    document.querySelectorAll('.customily_option').forEach((opt) => {
      const radios = Array.from(opt.querySelectorAll('input[type="radio"]'));
      if (!radios.length || radios.some((r) => r.checked)) return;
      opt.querySelector('label[role="button"]')?.click();
      const first = radios[0];
      const lbl = opt.querySelector(`label[for="${first.id}"]`) || first.closest('.customily-swatch')?.querySelector('label');
      if (lbl) lbl.click();
      else {
        first.click();
        first.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
  await page.waitForTimeout(2500);
}

async function addToCartAndReadPopup(page) {
  const t0 = Date.now();
  await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('product-form button[type="submit"], button[name="add"]')).find(
      (b) => b.offsetParent !== null && !b.disabled
    );
    if (btn) btn.click();
  });
  await page.waitForSelector('.cart-notification-wrapper.is-open', { timeout: 10000 });
  const openMs = Date.now() - t0;
  const src = await page.evaluate(() => {
    const img = document.querySelector('.cart-notification-wrapper.is-open img');
    return img ? String(img.currentSrc || img.getAttribute('src') || '') : '';
  });
  return { src, openMs };
}

async function closePopup(page) {
  await page.evaluate(() => document.querySelector('cart-notification')?.close?.());
  await page.waitForTimeout(1500);
}

async function runViewport(browser, name, contextOptions) {
  const ctx = await browser.newContext(contextOptions);
  const page = await ctx.newPage();
  await page.route('**/ip-blocker-embed*', (route) => route.abort()); // region app redirects bots
  await page.addInitScript(HIDE_OVERLAYS);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('product-info', { timeout: 30000 });
  await page.waitForTimeout(13000); // Customily boots + first render

  const hasFix = await page.evaluate(
    () => typeof document.querySelector('cart-notification')?.firstRenderedImageSrc === 'function'
  );
  assert.ok(hasFix, `${name}: theme ${THEME} is serving cart-notification.js without the fix — push it first`);

  await answerRequiredOptions(page);

  await typeName(page, 'ZEBRAONE');
  const first = await addToCartAndReadPopup(page);
  await closePopup(page);

  await typeName(page, 'QUOKKATWO');
  const second = await addToCartAndReadPopup(page);
  await page.waitForTimeout(300);

  await ctx.close();
  return { name, first, second };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  results.push(await runViewport(browser, 'mobile', devices['iPhone 13']));
  results.push(await runViewport(browser, 'desktop', { viewport: { width: 1440, height: 950 } }));
  await browser.close();

  for (const r of results) {
    console.log(`${r.name}: round1 ${r.first.openMs}ms ${label(r.first.src)}`);
    console.log(`${r.name}: round2 ${r.second.openMs}ms ${label(r.second.src)}`);
  }

  for (const r of results) {
    assert.ok(r.first.src, `${r.name}: popup opened with no image`);
    assert.ok(r.first.openMs < 3000, `${r.name}: popup took ${r.first.openMs}ms to open`);
    assert.ok(
      r.first.src.startsWith('data:'),
      `${r.name}: round 1 popup shows ${label(r.first.src)} instead of the live personalized render`
    );
    assert.ok(
      r.second.src.startsWith('data:'),
      `${r.name}: round 2 popup shows ${label(r.second.src)} instead of the live personalized render`
    );
    assert.notStrictEqual(
      r.second.src,
      r.first.src,
      `${r.name}: round 2 popup image is byte-identical to round 1 — still the old name`
    );
  }
  console.log('OK — both viewports show a fresh personalized preview on the second add to cart');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
