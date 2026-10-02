/**
 * Unit check: cart-notification.syncDetailsTextOnly image handling (local file, no push).
 *
 * A wrong optimistic canvas grab (data: URL of a half-rendered Customily frame) must be
 * replaced by the server preview of the line item just added; a plain Shopify CDN image
 * must NOT replace it (the PDP capture is the personalized one).
 *
 *   node scripts/check-atc-popup-image.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'cart-notification.js');

// 1x1 gif standing in for the optimistic canvas capture.
const CAPTURE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const SHOPIFY_IMG = 'https://www.myprintsy.com/cdn/shop/files/9_d560a102-bd2b-4a6a-a29f-24b7c9725473.jpg?width=200';
// Same reachable file, but matching the Customily preview pattern the theme looks for.
const SERVER_PREVIEW = `${SHOPIFY_IMG}&customily=1`;

function classSource() {
  const src = fs.readFileSync(ASSET, 'utf8');
  const cut = src.indexOf("customElements.define('cart-notification'");
  assert.ok(cut > 0, 'expected customElements.define at the end of cart-notification.js');
  return `${src.slice(0, cut)}\nwindow.__CartNotification = CartNotification;`;
}

async function sync(page, serverSrc) {
  return page.evaluate(
    async ([capture, next]) => {
      const el = document.createElement('div');
      el.innerHTML =
        '<div class="cart-item" data-myprintsy-optimistic="1">' +
        `<div class="cart-notification-product__image"><img src="${capture}"></div>` +
        '<div class="cart-notification-product__details">' +
        '<h3 class="cart-notification-product__name">Optimistic title</h3>' +
        '<p class="cart-notification-product__price">$ 1.00</p>' +
        '</div></div>';
      document.body.appendChild(el);

      const serverHtml =
        '<div class="cart-item">' +
        `<div class="cart-notification-product__image"><img src="${next}"></div>` +
        '<div class="cart-notification-product__details">' +
        '<h3 class="cart-notification-product__name">Server title</h3>' +
        '<p class="cart-notification-product__meta">Quantity: 1</p>' +
        '</div></div>';

      // Only these two fields are read by syncDetailsTextOnly.
      const self = { _lockedPriceText: '', _lockedImageSrc: capture };
      const ok = window.__CartNotification.prototype.syncDetailsTextOnly.call(self, el, serverHtml);
      await new Promise((r) => setTimeout(r, 3000)); // preload + swap
      return {
        ok,
        src: String(el.querySelector('img').getAttribute('src')),
        locked: String(self._lockedImageSrc),
        title: (el.querySelector('.cart-notification-product__name').textContent || '').trim(),
        stillOptimistic: !!el.querySelector('[data-myprintsy-optimistic]'),
      };
    },
    [CAPTURE, serverSrc]
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.myprintsy.com/robots.txt', { timeout: 60000 }); // same-origin as the images
  await page.addScriptTag({ content: classSource() });

  const upgraded = await sync(page, SERVER_PREVIEW);
  const kept = await sync(page, SHOPIFY_IMG);
  await browser.close();
  console.log({ upgraded, kept });

  assert.strictEqual(upgraded.ok, true, 'sync must report it patched the row');
  assert.strictEqual(upgraded.src, SERVER_PREVIEW, `server preview must win, got ${upgraded.src.slice(0, 60)}`);
  assert.strictEqual(upgraded.locked, SERVER_PREVIEW, 'locked src must follow the swap');
  assert.strictEqual(upgraded.title, 'Server title', 'title must come from cart HTML');
  assert.strictEqual(upgraded.stillOptimistic, false, 'optimistic flag must be cleared');
  assert.strictEqual(kept.src, CAPTURE, `plain Shopify image must not replace the capture, got ${kept.src.slice(0, 60)}`);
  console.log('OK — server preview upgrades the capture, Shopify CDN image does not');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
