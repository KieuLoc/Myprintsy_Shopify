/**
 * Black keepsake box (metafield -> add-on-gift-box-service) = flat: its own variant × qty, $4.99 each.
 * White box (legacy) keeps tier variants vertical-gift-box-N.
 *
 *   node scripts/check-gift-box-flat.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = process.env.THEME || '186878558524';
const BASE = 'https://myprintsy-3.myshopify.com/products/';
const BLACK_URL = BASE + 'musical-instrument-christmas-decoration-personalized-acrylic-ornament-xmthtt2o27?preview_theme_id=' + THEME;
const WHITE_URL = BASE + 'creep-it-real-personalized-accent-mug-gift-for-halloween-hwth1l30?preview_theme_id=' + THEME;
const BLACK_VARIANT = 52620375261500;
const WHITE_TIER3_VARIANT = 52918353264956;

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup,.cart-notification-wrapper,#PBarNextFrameWrapper{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

async function openPdp(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.addInitScript(HIDE_OVERLAY);
  const adds = [];
  await page.route('**/cart/add.js', (route) => {
    adds.push(JSON.parse(route.request().postData() || '{}'));
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.addon-gift-box__qty-input', { timeout: 30000 });
  await page.waitForFunction(() => window.GiftBoxPricing && window.GiftBoxTierVariantsByMode, null, { timeout: 15000 });
  await page.waitForTimeout(800);
  return { page, adds };
}

async function addBoxesViaProductForm(page, adds, qty) {
  await page.evaluate((next) => {
    const input = document.querySelector('.addon-gift-box__qty-input');
    input.value = String(next);
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }, qty);
  const price = await page.textContent('.addon-gift-box__price-value');
  const before = adds.length;
  const t0 = Date.now();
  await page.evaluate(() => publish(PUB_SUB_EVENTS.cartUpdate, { source: 'product-form' }));
  while (adds.length === before && Date.now() - t0 < 8000) await page.waitForTimeout(100);
  return { price: price.trim(), body: adds[adds.length - 1], ms: Date.now() - t0, count: adds.length - before };
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // Black box: flat
  const black = await openPdp(browser, BLACK_URL);
  const blackMode = await black.page.evaluate(() => window.GiftBoxPricing.getCurrentMode());
  assert.strictEqual(blackMode, 'flat', `hộp đen phải chạy mode flat, got ${blackMode}`);
  const title = (await black.page.textContent('.addon-gift-box__title')).trim();
  assert.ok(/keepsake/i.test(title), `PDP phải hiện hộp Keepsake, got "${title}"`);

  const b3 = await addBoxesViaProductForm(black.page, black.adds, 3);
  assert.strictEqual(b3.count, 1, `phải gọi /cart/add.js 1 lần, got ${b3.count} (${b3.ms}ms)`);
  assert.ok(/14\.97/.test(b3.price), `3 hộp đen phải $14.97 (4.99×3), PDP hiện "${b3.price}"`);
  const line3 = b3.body.items;
  assert.strictEqual(line3.length, 1, `3 hộp đen = 1 dòng, got ${line3.length}`);
  assert.strictEqual(line3[0].id, BLACK_VARIANT, `phải add variant hộp đen ${BLACK_VARIANT}, got ${line3[0].id}`);
  assert.strictEqual(line3[0].quantity, 3, `quantity phải 3, got ${line3[0].quantity}`);
  assert.strictEqual(line3[0].properties._gift_box_mode, 'flat', `mode property ${line3[0].properties._gift_box_mode}`);
  assert.strictEqual(line3[0].properties._gift_box_units, '1', `units/dòng phải 1, got ${line3[0].properties._gift_box_units}`);

  const b1 = await addBoxesViaProductForm(black.page, black.adds, 1);
  assert.ok(/4\.99/.test(b1.price), `1 hộp đen phải $4.99, PDP hiện "${b1.price}"`);
  assert.deepStrictEqual(
    [b1.body.items[0].id, b1.body.items[0].quantity],
    [BLACK_VARIANT, 1],
    `1 hộp đen: got ${JSON.stringify(b1.body.items)}`
  );

  const cartMath = await black.page.evaluate(() => ({
    flat3: window.GiftBoxPricing.withMode('flat', () => window.GiftBoxPricing.getTierPriceCents(3)),
    flat7: window.GiftBoxPricing.withMode('flat', () => window.GiftBoxPricing.getTierPriceCents(7)),
    legacy3: window.GiftBoxPricing.withMode('legacy', () => window.GiftBoxPricing.getTierPriceCents(3)),
  }));
  assert.strictEqual(cartMath.flat3, 1497, `subtotal cart flat 3 hộp = ${cartMath.flat3}`);
  assert.strictEqual(cartMath.flat7, 3493, `subtotal cart flat 7 hộp = ${cartMath.flat7}`);
  assert.strictEqual(cartMath.legacy3, 1199, `legacy 3 hộp vẫn tier $11.99, got ${cartMath.legacy3}`);

  // Error: network fail -> reject, inflight flag cleared
  await black.page.unroute('**/cart/add.js');
  await black.page.route('**/cart/add.js', (route) => route.abort('failed'));
  const netFail = await black.page.evaluate(() =>
    window.GiftBoxPricing.upsertGiftBoxInCart(2, 'net-test').then(
      () => ({ rejected: false }),
      (e) => ({ rejected: true, msg: String(e && e.message), inflight: sessionStorage.getItem('gift-box-upsert-inflight') })
    )
  );
  assert.ok(netFail.rejected, 'mất mạng phải reject');
  assert.strictEqual(netFail.inflight, null, `mất mạng xong cờ inflight phải xoá, got ${netFail.inflight}`);

  // Error: flat variant not configured -> reject, no add
  const missing = await black.page.evaluate(() => {
    window.GiftBoxPricing.setModeConfigs({ flat: { byUnits: {}, defaultVariantId: null } });
    window.GiftBoxPricing.applyMode('flat');
    return window.GiftBoxPricing.upsertGiftBoxInCart(2, 'x').then(
      () => 'resolved',
      (e) => String(e && e.message)
    );
  });
  assert.ok(/not configured/i.test(missing), `thiếu variant phải reject "not configured", got "${missing}"`);
  await black.page.close();

  // White box: legacy untouched
  const white = await openPdp(browser, WHITE_URL);
  const whiteMode = await white.page.evaluate(() => window.GiftBoxPricing.getCurrentMode());
  assert.strictEqual(whiteMode, 'legacy', `hộp trắng phải giữ legacy, got ${whiteMode}`);
  const w3 = await addBoxesViaProductForm(white.page, white.adds, 3);
  assert.ok(/11\.99/.test(w3.price), `3 hộp trắng vẫn tier $11.99, PDP hiện "${w3.price}"`);
  assert.deepStrictEqual(
    [w3.body.items.length, w3.body.items[0].id, w3.body.items[0].quantity, w3.body.items[0].properties._gift_box_mode],
    [1, WHITE_TIER3_VARIANT, 1, 'legacy'],
    `hộp trắng 3: got ${JSON.stringify(w3.body.items)}`
  );

  await browser.close();
  console.log('OK', {
    black3: { price: b3.price, ms: b3.ms, item: line3[0] },
    black1: { price: b1.price },
    cartMath,
    netFail,
    missing,
    white3: { price: w3.price, ms: w3.ms, id: w3.body.items[0].id },
  });
})().catch((error) => {
  console.error('FAIL:', error.message);
  process.exit(1);
});
