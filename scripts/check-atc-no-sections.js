/**
 * /cart/add no longer requests section HTML. After add, cart-notification must still:
 *   - unlock View Cart (countdown gate)
 *   - upgrade the optimistic image from the line-item Customily preview property
 *   - refresh the header cart badge from /cart.js
 * And the product-form must not ask Shopify to render sections on add.
 *
 * Failure branch: a plain Shopify CDN featured_image must NOT replace the optimistic capture.
 *
 *   node scripts/check-atc-no-sections.js
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const CAPTURE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const SERVER_PREVIEW = 'https://www.myprintsy.com/cdn/shop/files/9_d560a102-bd2b-4a6a-a29f-24b7c9725473.jpg?width=200&customily=1';
const SHOPIFY_IMG = 'https://www.myprintsy.com/cdn/shop/files/9_d560a102-bd2b-4a6a-a29f-24b7c9725473.jpg?width=200';

function cartNotificationSource() {
  const src = fs.readFileSync(path.join(ROOT, 'assets', 'cart-notification.js'), 'utf8');
  const cut = src.indexOf("customElements.define('cart-notification'");
  assert.ok(cut > 0, 'expected customElements.define at the end of cart-notification.js');
  return `${src.slice(0, cut)}\nwindow.__CartNotification = CartNotification;`;
}

function productFormSource() {
  return fs.readFileSync(path.join(ROOT, 'assets', 'product-form.js'), 'utf8');
}

(async () => {
  // Contract: product-form must not ask Shopify to render sections on /cart/add.
  const formSrc = productFormSource();
  assert.ok(
    !/formData\.append\(\s*['"]sections['"]/.test(formSrc),
    'product-form.js still appends sections to /cart/add'
  );
  assert.ok(
    !/formData\.append\(\s*['"]sections_url['"]/.test(formSrc),
    'product-form.js still appends sections_url to /cart/add'
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.myprintsy.com/robots.txt', { timeout: 60000 });
  await page.addScriptTag({ content: cartNotificationSource() });

  const result = await page.evaluate(async ([capture, preview, shopifyImg]) => {
    // Stub /cart.js used by refreshCartIconBubbleFromCart.
    window.fetch = async (url) => {
      if (String(url).includes('/cart.js')) {
        return {
          ok: true,
          json: async () => ({ item_count: 7, items: [] }),
        };
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    document.body.innerHTML = `
      <div id="cart-icon-bubble"><span class="svg-wrapper"></span></div>
      <cart-notification>
        <div id="cart-notification" class="cart-notification active">
          <div id="cart-notification-product">
            <div class="cart-item" data-myprintsy-optimistic="1">
              <div class="cart-notification-product__image"><img src="${capture}"></div>
              <div class="cart-notification-product__details">
                <h3 class="cart-notification-product__name">Mug</h3>
              </div>
            </div>
          </div>
          <a id="cart-notification-button" href="/cart"
             data-myprintsy-checkout-href="/cart"
             data-myprintsy-checkout-label="View Cart & Checkout"
             aria-disabled="true">Loading…</a>
        </div>
      </cart-notification>`;

    // Upgrade path: Customily preview in properties.
    const self = Object.create(window.__CartNotification.prototype);
    self.notification = document.getElementById('cart-notification');
    self.header = null;
    self._optimistic = true;
    self._suppressNextOpen = false;
    self._lockedImageSrc = capture;
    self._lockedPriceText = '';
    self._checkoutGateUntilAdd = true;
    self._checkoutCountdownTimer = null;
    self._checkoutHangTimer = null;
    self._cartWatchTimer = null;
    self.getCheckoutButton = window.__CartNotification.prototype.getCheckoutButton;
    self.resetCheckoutCountdownButton = window.__CartNotification.prototype.resetCheckoutCountdownButton;
    self.clearCheckoutCountdownTimer = window.__CartNotification.prototype.clearCheckoutCountdownTimer;
    self.clearCheckoutHangTimer = window.__CartNotification.prototype.clearCheckoutHangTimer;
    self.clearCartWatch = window.__CartNotification.prototype.clearCartWatch;
    self.finalizeFromLineItem = window.__CartNotification.prototype.finalizeFromLineItem;
    self.resolveLineItemPreviewSrc = window.__CartNotification.prototype.resolveLineItemPreviewSrc;
    self.upgradeOptimisticImage = window.__CartNotification.prototype.upgradeOptimisticImage;
    self.refreshCartIconBubble = window.__CartNotification.prototype.refreshCartIconBubble;
    self.refreshCartIconBubbleFromCart = window.__CartNotification.prototype.refreshCartIconBubbleFromCart;
    self.renderContents = window.__CartNotification.prototype.renderContents;
    self.getSectionsToRender = window.__CartNotification.prototype.getSectionsToRender;
    self.resolveOptimisticImage = () => '';
    self.open = () => {};

    self.renderContents({
      key: 'abc:1',
      properties: { '_customily-preview': preview },
      featured_image: { url: shopifyImg },
    });

    await new Promise((r) => setTimeout(r, 3500));

    const btn = document.getElementById('cart-notification-button');
    const img = document.querySelector('#cart-notification-product img');
    const bubble = document.querySelector('#cart-icon-bubble .cart-count-bubble span[aria-hidden="true"]');

    // Failure branch: plain Shopify featured_image must not replace the capture.
    const self2 = Object.create(window.__CartNotification.prototype);
    Object.assign(self2, {
      _lockedImageSrc: capture,
      upgradeOptimisticImage: window.__CartNotification.prototype.upgradeOptimisticImage,
      resolveLineItemPreviewSrc: window.__CartNotification.prototype.resolveLineItemPreviewSrc,
    });
    const el = document.createElement('div');
    el.innerHTML = `<div class="cart-notification-product__image"><img src="${capture}"></div>`;
    document.body.appendChild(el);
    // Temporarily point query to this el by id swap
    const host = document.getElementById('cart-notification-product');
    const prev = host.innerHTML;
    host.innerHTML = el.innerHTML;
    self2.upgradeOptimisticImage(self2.resolveLineItemPreviewSrc({ featured_image: { url: shopifyImg } }));
    await new Promise((r) => setTimeout(r, 50));
    const kept = host.querySelector('img').getAttribute('src');
    host.innerHTML = prev;

    return {
      optimisticGone: !document.querySelector('[data-myprintsy-optimistic]'),
      btnText: (btn.textContent || '').trim(),
      btnDisabled: btn.getAttribute('aria-disabled'),
      btnHref: btn.getAttribute('href'),
      imgSrc: img.getAttribute('src'),
      bubble: bubble ? bubble.textContent : null,
      plainShopifyKeptCapture: kept === capture,
    };
  }, [CAPTURE, SERVER_PREVIEW, SHOPIFY_IMG]);

  await browser.close();
  console.log(result);

  assert.ok(result.optimisticGone, 'optimistic marker must clear after finalize');
  assert.strictEqual(result.btnText, 'View Cart & Checkout', `button still "${result.btnText}"`);
  assert.strictEqual(result.btnDisabled, null, 'View Cart must unlock');
  assert.strictEqual(result.btnHref, '/cart');
  assert.strictEqual(result.imgSrc, SERVER_PREVIEW, `preview must upgrade, got ${result.imgSrc}`);
  assert.strictEqual(result.bubble, '7', `cart badge must show /cart.js item_count, got ${result.bubble}`);
  assert.ok(result.plainShopifyKeptCapture, 'plain Shopify CDN featured_image must not replace capture');
  console.log('OK — /cart/add skips sections; finalize unlocks View Cart + upgrades preview + badge');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
