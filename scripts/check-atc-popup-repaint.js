/**
 * Unit check: a new Add-to-cart click must repaint a popup that is still showing the PREVIOUS
 * line item. Dismissing the popup while /cart/add is in flight lets Customily's own ATC click
 * reopen it finalized; the next click then found `active && !_optimistic` and bailed out, so the
 * shopper kept seeing the old name's preview until the new /cart/add answered (mobile, ~4s+).
 *
 * Branches: stale finished cycle -> repaint with the current gallery image;
 *           cycle still in flight -> no repaint (late duplicate calls must not restart it).
 *
 *   node scripts/check-atc-popup-repaint.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'cart-notification.js');
const OLD_PREVIEW = 'https://cdn.customily.com/previews/name-ZEBRAONE.jpeg';
const NEW_GALLERY = 'https://www.myprintsy.com/cdn/shop/files/name-QUOKKATWO.jpg?width=1080';

function classSource() {
  const src = fs.readFileSync(ASSET, 'utf8');
  const cut = src.indexOf("customElements.define('cart-notification'");
  assert.ok(cut > 0, 'expected customElements.define at the end of cart-notification.js');
  return `${src.slice(0, cut)}\nwindow.__CartNotification = CartNotification;`;
}

async function run(page, opts) {
  return page.evaluate(
    ([o, oldPreview, newGallery]) => {
      window.trapFocus = () => {};
      window.removeTrapFocus = () => {};
      document.body.innerHTML = `
        <h1 class="product__title">Accent Mug</h1>
        <div class="product__media-item is-active">
          <div class="product-media-container" style="position:relative;width:390px;height:390px">
            <div class="product__media"><img src="${newGallery}" style="width:390px;height:390px"></div>
          </div>
        </div>
        <div id="cart-notification" class="cart-notification active">
          <div class="cart-notification-wrapper is-open">
            <div id="cart-notification-product">
              <div class="cart-item"${o.inFlight ? ' data-myprintsy-optimistic="1"' : ''}>
                <div class="cart-notification-product__image"><img src="${oldPreview}" alt=""></div>
                <div class="cart-notification-product__details"><h3>Accent Mug</h3></div>
              </div>
            </div>
            <a id="cart-notification-button" href="/cart">View Cart &amp; Checkout</a>
          </div>
          <div data-cart-notification-overlay hidden></div>
        </div>`;

      const self = Object.create(window.__CartNotification.prototype);
      self.notification = document.getElementById('cart-notification');
      self.wrapper = document.querySelector('.cart-notification-wrapper');
      self.overlay = document.querySelector('[data-cart-notification-overlay]');
      self.header = null;
      self.onBodyClick = () => {};
      self._optimistic = !!o.inFlight;
      self._suppressNextOpen = false;
      self._lockedImageSrc = oldPreview;
      self._lockedPriceText = '';
      self._ignoreBodyClickUntil = 0;
      self._bodyListenTimer = null;

      self.openOptimistic({ fromUserGesture: true });

      const img = document.querySelector('#cart-notification-product .cart-notification-product__image img');
      return {
        src: img ? String(img.getAttribute('src')) : '',
        optimistic: !!self._optimistic,
        isOpen: !!document.querySelector('.cart-notification-wrapper')?.classList.contains('is-open'),
      };
    },
    [opts, OLD_PREVIEW, NEW_GALLERY]
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://www.myprintsy.com/robots.txt', { timeout: 60000 });
  await page.addScriptTag({ content: classSource() });

  const stale = await run(page, { inFlight: false });
  const inFlight = await run(page, { inFlight: true });
  await browser.close();
  console.log({ stale, inFlight });

  assert.strictEqual(stale.src, NEW_GALLERY, 'new click must repaint the finished popup with the current preview');
  assert.ok(stale.optimistic, 'repaint must start a new optimistic cycle');
  assert.ok(stale.isOpen, 'popup must stay open after the repaint');
  assert.strictEqual(inFlight.src, OLD_PREVIEW, 'a cycle still in flight must not be repainted');
  console.log('OK — stale popup repaints on a new click, in-flight popup is left alone');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
