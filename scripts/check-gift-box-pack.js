/**
 * Pack × product quantity = gift box units.
 * Those units become ONE cart line of that tier (qty 1), not N packs.
 *
 *   node scripts/check-gift-box-pack.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = '186878558524';
const url =
  'https://myprintsy-3.myshopify.com/products/creep-it-real-personalized-accent-mug-gift-for-halloween-hwth1l30?preview_theme_id=' +
  THEME;

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup,.cart-notification-wrapper,#PBarNextFrameWrapper{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

function readState() {
  const product = document.querySelector('product-info input[name="quantity"]');
  const box = document.querySelector('.addon-gift-box__qty-input');
  const field = [...document.querySelectorAll('variant-selects fieldset')].find((node) =>
    /pack|buy more/i.test(node.querySelector('legend')?.textContent || '')
  );
  const checked = field?.querySelector('input[type="radio"]:checked');
  return {
    product: product ? String(product.value) : '',
    box: box ? String(box.value) : '',
    hasBox: Boolean(box),
    packValue: checked ? String(checked.value) : '',
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.addInitScript(HIDE_OVERLAY);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.addon-gift-box__qty-input', { timeout: 30000 });
  await page.waitForTimeout(800);

  async function choosePack(n) {
    const picked = await page.evaluate((packNumber) => {
      const field = [...document.querySelectorAll('variant-selects fieldset')].find((node) =>
        /pack|buy more/i.test(node.querySelector('legend')?.textContent || '')
      );
      if (!field) return { ok: false, reason: 'không thấy option pack' };
      const radio = [...field.querySelectorAll('input[type="radio"]')].find((input) => {
        const label = field.querySelector('label[for="' + input.id + '"]');
        const text = (input.value + ' ' + (label ? label.textContent : '')).replace(/\s+/g, ' ');
        return new RegExp('pack\\s*' + packNumber + '\\b', 'i').test(text);
      });
      if (!radio) {
        return {
          ok: false,
          reason: 'không thấy Pack ' + packNumber,
          options: [...field.querySelectorAll('input[type="radio"]')].map((input) => input.value),
        };
      }
      radio.click();
      radio.dispatchEvent(new Event('change', { bubbles: true }));
      return { ok: true, value: radio.value };
    }, n);
    assert.ok(picked.ok, picked.reason + ' ' + JSON.stringify(picked.options || []));
    await page.waitForTimeout(400);
    return picked.value;
  }

  async function setProductQty(qty) {
    await page.evaluate((next) => {
      const input = document.querySelector('product-info input[name="quantity"]');
      input.value = String(next);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }, qty);
    await page.waitForTimeout(250);
  }

  const start = await page.evaluate(readState);
  assert.ok(start.hasBox, 'mug Halloween không có gift box');

  const pack2 = await choosePack(2);
  await setProductQty(2);
  const atPack2Qty2 = await page.evaluate(readState);
  assert.strictEqual(atPack2Qty2.product, '2', `SP phải là 2, got ${atPack2Qty2.product}`);
  assert.strictEqual(atPack2Qty2.box, '4', `Pack 2 × SP 2 phải ra 4 box, got ${atPack2Qty2.box}`);

  const pack4 = await choosePack(4);
  await setProductQty(1);
  const atPack4Qty1 = await page.evaluate(readState);
  assert.strictEqual(atPack4Qty1.product, '1', `SP phải là 1, got ${atPack4Qty1.product}`);
  assert.strictEqual(atPack4Qty1.box, '4', `Pack 4 × SP 1 phải ra 4 box, got ${atPack4Qty1.box}`);

  const lines = await page.evaluate(() => ({
    three: window.GiftBoxPricing.decomposeGiftBoxUnits(3),
    four: window.GiftBoxPricing.decomposeGiftBoxUnits(4),
  }));
  assert.strictEqual(lines.three.length, 1, '3 box phải là 1 dòng');
  assert.strictEqual(lines.three[0].tierUnits, 3, `tier 3, got ${lines.three[0].tierUnits}`);
  assert.strictEqual(lines.three[0].cartQuantity, 1, `3 box là 1 gói box 3, got qty ${lines.three[0].cartQuantity}`);
  assert.strictEqual(lines.three[0].isBulk, false, '3 box không phải bulk');
  assert.strictEqual(lines.four.length, 1, '4 box phải là 1 dòng');
  assert.strictEqual(lines.four[0].tierUnits, 4, `tier 4, got ${lines.four[0].tierUnits}`);
  assert.strictEqual(lines.four[0].cartQuantity, 1, `4 box là 1 gói box 4, got qty ${lines.four[0].cartQuantity}`);

  await browser.close();
  console.log('OK', { start, pack2, atPack2Qty2, pack4, atPack4Qty1, lines });
})().catch((error) => {
  console.error('FAIL:', error.message);
  process.exit(1);
});
