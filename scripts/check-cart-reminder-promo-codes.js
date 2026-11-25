/**
 * Cart reminder → Success opt-in codes:
 *   filled cart → MERRY25
 *   empty cart  → XMAS25
 *
 *   node scripts/check-cart-reminder-promo-codes.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;

const EMPTY_CART = { item_count: 0, items: [] };
const FILLED_CART = {
  item_count: 1,
  items: [
    {
      product_title: 'Fake Mug',
      title: 'Fake Mug',
      quantity: 1,
      final_line_price: 2995,
      original_line_price: 2995,
      properties: {},
      image: '',
    },
  ],
};

async function readSuccessCode(page) {
  return page.evaluate(() => {
    const el = [...document.querySelectorAll('success-opt-in-popup')].find(
      (c) => c.matchesDeviceTarget?.() !== false
    );
    if (!el) throw new Error('no success-opt-in-popup');
    const target =
      [...document.querySelectorAll('success-opt-in-popup')].find((c) => c.dataset.deviceTarget === 'desktop') || el;
    const prefix = target.querySelector('.success-opt-in-popup__heading-prefix');
    const copy = target.querySelector('[data-success-opt-in-copy]');
    return {
      dataset: (target.dataset.promoCode || '').trim(),
      prefix: (prefix?.textContent || '').trim(),
      copy: (copy?.dataset.copyCode || '').trim(),
      open: !!target.modal?.classList.contains('is-open'),
    };
  });
}

async function openFromCart(page, cartBody) {
  await page.unroute('**/cart.js').catch(() => {});
  await page.route('**/cart.js', (route) =>
    route.fulfill({ contentType: 'application/json', body: JSON.stringify(cartBody) })
  );
  await page.evaluate(async () => {
    const reminder = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    if (!reminder) throw new Error('no cart reminder');
    [...document.querySelectorAll('success-opt-in-popup')].forEach((el) => el.close?.());
    await reminder.openSuccessOptIn();
  });
  return readSuccessCode(page);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => customElements.get('cart-reminder-popup') && customElements.get('success-opt-in-popup'),
    null,
    { timeout: 30000 }
  );

  const gate = await page.evaluate(() => {
    const reminder = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    const attrs = {
      filledAttr: (reminder.dataset.promoCodeFilled || '').trim(),
      emptyAttr: (reminder.dataset.promoCodeEmpty || '').trim(),
    };
    reminder.cartCount = 0;
    const emptyCode = reminder.getCartReminderPromoCode();
    reminder.cartCount = 2;
    const filledCode = reminder.getCartReminderPromoCode();
    reminder.dataset.promoCodeFilled = 'TESTFILL';
    reminder.dataset.promoCodeEmpty = 'TESTEMPTY';
    reminder.cartCount = 0;
    const emptyOverride = reminder.getCartReminderPromoCode();
    reminder.cartCount = 1;
    const filledOverride = reminder.getCartReminderPromoCode();
    reminder.dataset.promoCodeFilled = attrs.filledAttr;
    reminder.dataset.promoCodeEmpty = attrs.emptyAttr;
    return { ...attrs, emptyCode, filledCode, emptyOverride, filledOverride };
  });
  assert.ok(gate.filledAttr, `promo_code_filled attr missing`);
  assert.ok(gate.emptyAttr, `promo_code_empty attr missing`);
  assert.strictEqual(gate.emptyCode, gate.emptyAttr || 'XMAS25', `empty cart code: ${gate.emptyCode}`);
  assert.strictEqual(gate.filledCode, gate.filledAttr || 'MERRY25', `filled cart code: ${gate.filledCode}`);
  assert.strictEqual(gate.emptyOverride, 'TESTEMPTY', `empty override: ${gate.emptyOverride}`);
  assert.strictEqual(gate.filledOverride, 'TESTFILL', `filled override: ${gate.filledOverride}`);

  const emptyUi = await openFromCart(page, EMPTY_CART);
  assert.ok(emptyUi.open, 'empty: success opt-in must open');
  assert.strictEqual(emptyUi.dataset, 'XMAS25', `empty dataset: ${emptyUi.dataset}`);
  assert.strictEqual(emptyUi.prefix, 'XMAS25', `empty prefix: ${emptyUi.prefix}`);
  assert.strictEqual(emptyUi.copy, 'XMAS25', `empty copy: ${emptyUi.copy}`);

  const filledUi = await openFromCart(page, FILLED_CART);
  assert.ok(filledUi.open, 'filled: success opt-in must open');
  assert.strictEqual(filledUi.dataset, 'MERRY25', `filled dataset: ${filledUi.dataset}`);
  assert.strictEqual(filledUi.prefix, 'MERRY25', `filled prefix: ${filledUi.prefix}`);
  assert.strictEqual(filledUi.copy, 'MERRY25', `filled copy: ${filledUi.copy}`);

  await browser.close();
  console.log({ gate, emptyUi, filledUi });
  console.log('OK — empty→XMAS25, filled→MERRY25 on Success opt-in');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
