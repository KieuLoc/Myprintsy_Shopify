/**
 * Gift box quantity follows the product quantity. Editing the box does not
 * write back to the product quantity. A later product-quantity change wins again.
 *
 *   node scripts/check-gift-box-qty-sync.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = '186878558524';
const url =
  'https://myprintsy-3.myshopify.com/products/who-makes-the-rules-personalized-ceramic-mug-kdthah1o12?preview_theme_id=' +
  THEME;

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup,.cart-notification-wrapper{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

function readQty() {
  const product = document.querySelector('product-info input[name="quantity"]');
  const box = document.querySelector('.addon-gift-box__qty-input');
  return {
    product: product ? String(product.value) : '',
    box: box ? String(box.value) : '',
    hasBox: Boolean(box),
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.addInitScript(HIDE_OVERLAY);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('product-info input[name="quantity"]', { timeout: 30000 });
  await page.waitForSelector('.addon-gift-box__qty-input', { timeout: 30000 });
  await page.waitForTimeout(800);

  const start = await page.evaluate(readQty);
  assert.ok(start.hasBox, 'trang không có ô gift box');
  assert.strictEqual(start.product, '1', `số SP ban đầu phải là 1, got ${start.product}`);
  const pack = Number(start.box);
  assert.ok(pack >= 1, `số box ban đầu phải >= 1, got ${start.box}`);

  const productPlus = page.locator('product-info .product-form__quantity button[name="plus"]');
  await productPlus.click();
  await productPlus.click();
  await page.waitForTimeout(200);

  const atThree = await page.evaluate(readQty);
  assert.strictEqual(atThree.product, '3', `SP phải là 3, got ${atThree.product}`);
  assert.strictEqual(
    Number(atThree.box),
    pack * 3,
    `box phải thành ${pack * 3} khi SP = 3, got ${atThree.box}`
  );

  await page.locator('.addon-gift-box__qty-plus').click();
  await page.waitForTimeout(150);

  const afterBoxEdit = await page.evaluate(readQty);
  assert.strictEqual(afterBoxEdit.product, '3', `sửa box không được đổi SP, got ${afterBoxEdit.product}`);
  assert.strictEqual(
    Number(afterBoxEdit.box),
    pack * 3 + 1,
    `box phải tăng 1, got ${afterBoxEdit.box}`
  );

  await productPlus.click();
  await page.waitForTimeout(200);

  const atFour = await page.evaluate(readQty);
  assert.strictEqual(atFour.product, '4', `SP phải là 4, got ${atFour.product}`);
  assert.strictEqual(
    Number(atFour.box),
    pack * 4,
    `đổi SP lần nữa phải kéo box về ${pack * 4}, got ${atFour.box}`
  );

  await page.evaluate(() => {
    const input = document.querySelector('product-info input[name="quantity"]');
    input.value = '5';
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(200);
  const split = await page.evaluate(() => {
    const lines = window.GiftBoxPricing.decomposeGiftBoxUnits(
      Number(document.querySelector('.addon-gift-box__qty-input').value)
    );
    return { box: document.querySelector('.addon-gift-box__qty-input').value, lines };
  });
  assert.strictEqual(split.box, String(pack * 5), `box lúc SP 5 phải là ${pack * 5}, got ${split.box}`);
  assert.strictEqual(split.lines.length, 1, `5 box phải thành 1 dòng, got ${split.lines.length}`);
  assert.strictEqual(split.lines[0].tierUnits, pack * 5, `tier phải là ${pack * 5}, got ${split.lines[0].tierUnits}`);
  assert.strictEqual(split.lines[0].cartQuantity, 1, `Shopify qty của gói 5 phải là 1, got ${split.lines[0].cartQuantity}`);

  await browser.close();
  console.log('OK', { start, atThree, afterBoxEdit, atFour, split });
})().catch((error) => {
  console.error('FAIL:', error.message);
  process.exit(1);
});
