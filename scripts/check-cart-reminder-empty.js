/**
 * Cart reminder shows on an empty cart too, with 3 Best Sellers + 2 Bedding Set products.
 * Welcome keeps the first turn; a filled cart keeps the old behaviour (cart items, visited-cart gate).
 *
 *   node scripts/check-cart-reminder-empty.js        (THEME=183186358588 for LIVE)
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;
const FAKE_CART = {
  item_count: 1,
  items: [
    {
      product_title: 'Fake Mug',
      title: 'Fake Mug',
      quantity: 2,
      final_line_price: 2995,
      original_line_price: 2995,
      product_has_only_default_variant: true,
      properties: {},
      image: '',
    },
  ],
};

async function openReminder(page) {
  return page.evaluate(async () => {
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    await el.refreshCartItems();
    el.modal.classList.add('is-open');
    const visible = (sel) => [...el.querySelectorAll(sel)].filter((n) => !n.hidden && n.offsetParent !== null);
    return {
      emptyOnly: visible('[data-cart-empty-only]').length,
      filledOnly: visible('[data-cart-filled-only]').length,
      recLinks: visible('.cart-reminder-popup__items--recommendations a[href*="/products/"]').length,
      cartRows: el.querySelectorAll('[data-cart-items] .cart-reminder-popup__item').length,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  let cartMode = 'real';
  await page.route('**/cart.js', (route) => {
    if (cartMode === 'fail') return route.abort();
    if (cartMode === 'filled') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(FAKE_CART) });
    return route.continue();
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, { timeout: 30000 });

  const gate = await page.evaluate(() => {
    const all = [...document.querySelectorAll('cart-reminder-popup')];
    const reminder = all.find((c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget());
    const welcome = all.find((c) => c.dataset.storageKey === 'welcome-popup' && c.matchesDeviceTarget());
    reminder.dataset.enabled = 'true';
    welcome.dataset.enabled = 'true';
    for (const k of ['welcome-popup', 'cart-reminder-popup']) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(`${k}-session-shown`);
    }
    localStorage.removeItem('cart-reminder-popup-visited-cart');
    reminder.cartCount = 0;
    const emptyWelcomePending = reminder.canShow();
    sessionStorage.setItem('welcome-popup-session-shown', '1');
    const emptyWelcomeDone = reminder.canShow();
    reminder.cartCount = 1;
    const filledNoVisit = reminder.canShow();
    localStorage.setItem('cart-reminder-popup-visited-cart', '1');
    const filledVisited = reminder.canShow();
    localStorage.removeItem('cart-reminder-popup-visited-cart');

    reminder.cartCount = 0;
    window.clearTimeout(reminder.constructor.browseAutoShowTimer);
    reminder.constructor.browseAutoShowTimer = null;
    reminder.armBrowseAutoShowTimer();
    const timerArmedOnEmpty = reminder.constructor.browseAutoShowTimer !== null;
    reminder.constructor.clearAutoShowTimers();
    return { emptyWelcomePending, emptyWelcomeDone, filledNoVisit, filledVisited, timerArmedOnEmpty };
  });

  cartMode = 'real';
  const empty = await openReminder(page);
  cartMode = 'filled';
  const filled = await openReminder(page);
  cartMode = 'fail';
  const failed = await openReminder(page);
  await browser.close();
  console.log({ gate, empty, filled, failed });

  assert.strictEqual(gate.emptyWelcomePending, false, 'empty cart: must wait while Welcome can still show');
  assert.strictEqual(gate.emptyWelcomeDone, true, 'empty cart: must be allowed once Welcome had its turn');
  assert.strictEqual(gate.filledNoVisit, false, 'filled cart: visited-cart gate must still apply');
  assert.strictEqual(gate.filledVisited, true, 'filled cart + visited /cart: must be allowed');
  assert.strictEqual(gate.timerArmedOnEmpty, true, 'browse auto-show timer must arm on an empty cart');

  assert.strictEqual(empty.recLinks, 5, `empty cart: expected 3 Best Sellers + 2 Bedding Set, got ${empty.recLinks}`);
  assert.ok(empty.emptyOnly >= 2, `empty cart: empty-cart texts + list visible, got ${empty.emptyOnly}`);
  assert.strictEqual(empty.filledOnly, 0, `empty cart: cart texts must be hidden, got ${empty.filledOnly}`);

  assert.strictEqual(filled.recLinks, 0, `filled cart: recommendations must hide, got ${filled.recLinks}`);
  assert.strictEqual(filled.emptyOnly, 0, `filled cart: empty-cart texts must hide, got ${filled.emptyOnly}`);
  assert.strictEqual(filled.cartRows, 1, `filled cart: expected 1 cart row, got ${filled.cartRows}`);
  assert.ok(filled.filledOnly >= 2, `filled cart: cart texts visible, got ${filled.filledOnly}`);

  assert.strictEqual(failed.cartRows, 1, `/cart.js fail: keep last rendered rows, got ${failed.cartRows}`);
  assert.strictEqual(failed.emptyOnly, 0, `/cart.js fail: must not flip state, got ${failed.emptyOnly}`);
  console.log('OK — empty cart shows recommendations after Welcome; filled cart unchanged; fetch failure keeps state');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
