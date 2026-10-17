/**
 * Subtotal includes the gift box tier price.
 * A) Shopify total omitted a $0 gift line → subtotal becomes mug + $11.99.
 * B) Shopify total already includes the gift line → subtotal is not doubled.
 *
 *   node scripts/check-gift-box-subtotal.js
 */
const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');

const THEME = '186878558524';
const PAGE =
  'https://myprintsy-3.myshopify.com/products/who-makes-the-rules-personalized-ceramic-mug-kdthah1o12?preview_theme_id=' +
  THEME;
const SCRIPT = path.join(__dirname, '..', 'assets', 'cart-gift-box.js');

function cart({ total, giftFinal }) {
  return {
    total_price: total,
    item_count: 4,
    items: [
      { quantity: 3, final_line_price: 6873, properties: {} },
      {
        quantity: 1,
        final_line_price: giftFinal,
        properties: {
          _addon_gift_box: 'true',
          _gift_box_units: '3',
          _gift_box_mode: 'legacy',
        },
      },
    ],
  };
}

async function readSubtotal(page, body) {
  await page.route('**/cart.js', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })
  );
  await page.goto(PAGE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => window.GiftBoxPricing && window.GiftBoxPricing.getTierPriceCents, null, {
    timeout: 30000,
  });
  await page.evaluate(() => {
    const node = document.createElement('p');
    node.setAttribute('data-hulkapps-cart-total', '');
    node.className = 'totals__total-value';
    node.textContent = '$68.73 USD';
    document.body.appendChild(node);
  });
  await page.addScriptTag({ path: SCRIPT });
  await page.waitForFunction(
    () => /80\.72/.test(document.querySelector('[data-hulkapps-cart-total]')?.textContent || ''),
    null,
    { timeout: 10000 }
  );
  return page.locator('[data-hulkapps-cart-total]').innerText();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  const omitted = await browser.newPage();
  const omittedText = await readSubtotal(omitted, cart({ total: 6873, giftFinal: 0 }));
  assert.ok(/80\.72/.test(omittedText), `A: subtotal phải cộng box $11.99, got ${omittedText}`);
  await omitted.close();

  const included = await browser.newPage();
  const includedText = await readSubtotal(included, cart({ total: 8072, giftFinal: 1199 }));
  assert.ok(/80\.72/.test(includedText), `B: không được cộng box hai lần, got ${includedText}`);
  assert.ok(!/92\.71/.test(includedText), `B: subtotal bị nhân đôi ${includedText}`);
  await included.close();

  await browser.close();
  console.log('OK', { omittedText, includedText });
})().catch((error) => {
  console.error('FAIL:', error.message);
  process.exit(1);
});
