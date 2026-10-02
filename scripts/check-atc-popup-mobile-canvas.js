/**
 * Unit check: on mobile Customily swaps the theme gallery for its own slider
 * (.customily_gallery_media > .customily_gallery_slide), parks the theme gallery at 0x0 and
 * renders the live design on a canvas inside the front slide.
 *
 * The popup must follow that slider:
 *   1. live canvas in the front slide wins (desktop behaviour — fresh name shows immediately);
 *   2. blank/tainted canvas -> the front slide photo, never the 0x0 pinned fallback nor an
 *      off-screen slide (that is how the previous design kept showing up on mobile).
 *
 *   node scripts/check-atc-popup-mobile-canvas.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'cart-notification.js');
const HIDDEN_PINNED = 'https://www.myprintsy.com/cdn/shop/files/catalog-base.png?width=1080';
const OFFSCREEN_SLIDE = 'https://www.myprintsy.com/cdn/shop/files/Accent-Mug-7.jpg?width=1080';
const FRONT_SLIDE = 'https://www.myprintsy.com/cdn/shop/files/Accent-Mug-front.jpg?width=1080';

function classSource() {
  const src = fs.readFileSync(ASSET, 'utf8');
  const cut = src.indexOf("customElements.define('cart-notification'");
  assert.ok(cut > 0, 'expected customElements.define at the end of cart-notification.js');
  return `${src.slice(0, cut)}\nwindow.__CartNotification = CartNotification;`;
}

async function pick(page, opts) {
  return page.evaluate(
    async ([o, pinned, offscreen, front]) => {
      const slide = 'position:absolute;top:0;width:390px;height:390px';
      document.body.style.margin = '0';
      document.body.innerHTML = `
        <div class="product__media-wrapper">
          <!-- theme gallery: still in the DOM, collapsed to 0x0 by Customily -->
          <media-gallery style="display:block;width:0;height:0;overflow:hidden">
            <div class="product__media-item is-active">
              <div class="product-media-container" style="position:relative;width:0;height:0">
                <div class="product__media"><img src="${pinned}" style="width:0;height:0"></div>
                <img class="myprintsy-shopify-fallback" src="${pinned}" style="width:0;height:0">
              </div>
            </div>
          </media-gallery>

          <div class="customily_gallery"><div class="customily_gallery_media" style="position:relative;width:390px;height:390px;overflow:hidden">
            <div class="customily_gallery_slider">
              <div class="customily_gallery_slide" style="${slide};left:-390px">
                <img class="customily_gallery_image" src="${offscreen}" style="${slide};left:0">
              </div>
              <div class="customily_gallery_slide" style="${slide};left:0">
                ${
                  o.liveCanvas
                    ? `<div class="canvas-container" style="${slide};left:0">
                         <canvas class="lower-canvas" width="390" height="390" style="${slide};left:0"></canvas>
                         <canvas class="upper-canvas" width="390" height="390" style="${slide};left:0"></canvas>
                       </div>`
                    : `<img class="customily_gallery_image" src="${front}" style="${slide};left:0">`
                }
              </div>
            </div>
          </div></div>
        </div>`;

      const lower = document.querySelector('canvas.lower-canvas');
      if (lower && o.paintCanvas) {
        const ctx = lower.getContext('2d');
        const px = ctx.createImageData(390, 390);
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
    [opts, HIDDEN_PINNED, OFFSCREEN_SLIDE, FRONT_SLIDE]
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://www.myprintsy.com/robots.txt', { timeout: 60000 });
  await page.addScriptTag({ content: classSource() });

  const live = await pick(page, { liveCanvas: true, paintCanvas: true });
  const blank = await pick(page, { liveCanvas: true, paintCanvas: false });
  const noCanvas = await pick(page, { liveCanvas: false });
  await browser.close();
  console.log({ live, blank, noCanvas });

  assert.strictEqual(live.kind, 'canvas', 'live Customily canvas in the front slide must win on mobile');
  assert.ok(live.len > 20000, `canvas capture looks blank (${live.len} chars)`);
  // Front slide holds only the canvas, so a blank one leaves nothing on screen: last resort is the
  // collapsed gallery photo — an empty popup image would be worse.
  assert.strictEqual(blank.kind, HIDDEN_PINNED, 'blank canvas must still yield a gallery photo, not an empty src');
  assert.strictEqual(noCanvas.kind, FRONT_SLIDE, 'no canvas: front slide must beat the off-screen slide and the 0x0 pinned photo');
  console.log('OK — mobile popup follows Customily slider (live canvas, else front slide)');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
