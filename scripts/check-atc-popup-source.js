/**
 * Unit check: which node the cart-notification popup takes its image from (local file, no push).
 *
 * The popup must show the main image on screen:
 *   1. Customily's rendered canvas wins, even when a bigger leftover "customily" <img> is present.
 *   2. fabric's transparent .upper-canvas is never captured.
 *   3. blank/tainted canvas -> fall back to the active gallery photo, never to a leftover preview
 *      hiding under the canvas (that is how a whole other design showed up in the popup).
 *
 *   node scripts/check-atc-popup-source.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'cart-notification.js');
const STALE_PREVIEW = 'https://cdn.customily.com/shopify/assetFiles/previews/other-shop/OLD-DESIGN.jpeg';
const MAIN_PHOTO = 'https://www.myprintsy.com/cdn/shop/files/9_d560a102-bd2b-4a6a-a29f-24b7c9725473.jpg?width=600';
const PINNED_PHOTO = 'https://www.myprintsy.com/cdn/shop/files/pack2-pinned.jpg?width=600';

function classSource() {
  const src = fs.readFileSync(ASSET, 'utf8');
  const cut = src.indexOf("customElements.define('cart-notification'");
  assert.ok(cut > 0, 'expected customElements.define at the end of cart-notification.js');
  return `${src.slice(0, cut)}\nwindow.__CartNotification = CartNotification;`;
}

/**
 * @param {{ paintCanvas: boolean, upperOnly?: boolean, pinned?: boolean }} opts
 */
async function pick(page, opts) {
  return page.evaluate(
    async ([o, stale, photo, pinnedPhoto]) => {
      // Layers overlap like the real PDP: Shopify photo at the bottom, a leftover Customily
      // preview above it, Customily's canvas pair on top.
      const layer = 'position:absolute;inset:0;width:650px;height:650px';
      document.body.innerHTML = `
        <media-gallery>
          <div class="product__media-item is-active">
            <div class="product-media-container media-type-image" style="position:relative;width:650px;height:650px">
              <div class="product__media" style="${layer};z-index:0"><img src="${photo}" style="${layer}"></div>
              <img class="cl-preview" src="${stale}" style="${layer};z-index:1">
              <div class="cl-canvas-container" style="${layer};z-index:2"><div class="canvas-container" style="${layer}">
                ${o.upperOnly ? '' : `<canvas id="preview-canvas" class="lower-canvas" width="650" height="650" style="${layer}"></canvas>`}
                <canvas class="upper-canvas" width="650" height="650" style="${layer}"></canvas>
              </div></div>
              ${
                o.pinned
                  ? `<img class="myprintsy-shopify-fallback" src="${pinnedPhoto}" style="${layer};z-index:4;pointer-events:none">`
                  : ''
              }
            </div>
          </div>
        </media-gallery>`;

      if (o.pinned) {
        // What customily-preview-atc.js does once the Shopify photo is pinned.
        document.querySelectorAll('.product-media-container canvas, .product-media-container img.cl-preview').forEach((el) => {
          el.style.setProperty('z-index', '0', 'important');
          el.style.setProperty('pointer-events', 'none', 'important');
        });
      }

      const lower = document.querySelector('canvas.lower-canvas');
      if (lower && o.paintCanvas) {
        // Noise so the JPEG is clearly a real render, not a blank frame.
        const ctx = lower.getContext('2d');
        const px = ctx.createImageData(650, 650);
        for (let i = 0; i < px.data.length; i += 4) {
          px.data[i] = (i * 7) % 255;
          px.data[i + 1] = (i * 13) % 255;
          px.data[i + 2] = (i * 29) % 255;
          px.data[i + 3] = 255;
        }
        ctx.putImageData(px, 0, 0);
      }

      await new Promise((r) => requestAnimationFrame(() => r()));
      const self = Object.create(window.__CartNotification.prototype);
      const src = String(self.resolveOptimisticImage() || '');
      return { kind: src.slice(0, 5) === 'data:' ? 'canvas' : src, len: src.length };
    },
    [opts, STALE_PREVIEW, MAIN_PHOTO, PINNED_PHOTO]
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto('https://www.myprintsy.com/robots.txt', { timeout: 60000 });
  await page.addScriptTag({ content: classSource() });

  const painted = await pick(page, { paintCanvas: true });
  const blank = await pick(page, { paintCanvas: false });
  const noLower = await pick(page, { paintCanvas: false, upperOnly: true });
  // Pack 1 added, popup closed, Pack 2 chosen: canvas still holds the Pack 1 render but the
  // gallery now shows the pinned Shopify photo — the popup must follow the gallery.
  const pinned = await pick(page, { paintCanvas: true, pinned: true });
  await browser.close();
  console.log({ painted, blank, noLower, pinned });

  assert.strictEqual(painted.kind, 'canvas', `rendered canvas must win over ${STALE_PREVIEW}`);
  assert.ok(painted.len > 20000, `canvas capture looks blank (${painted.len} chars)`);
  assert.strictEqual(blank.kind, MAIN_PHOTO, 'blank canvas must fall back to the main photo');
  assert.strictEqual(noLower.kind, MAIN_PHOTO, 'upper-canvas alone must not be captured');
  assert.strictEqual(pinned.kind, PINNED_PHOTO, 'pinned gallery must beat the demoted (stale) canvas');
  console.log('OK — popup takes the rendered canvas, the pinned photo when the gallery is pinned');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
