/**
 * Welcome mobile media: landscape banner must use contain (not 1/1 cover crop).
 *   node scripts/check-welcome-media-fit.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(
    `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}&v=${Date.now()}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }
  );
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, {
    timeout: 20000,
  });
  await page.waitForTimeout(800);

  const data = await page.evaluate(async () => {
    const host = [...document.querySelectorAll('cart-reminder-popup')].find((h) =>
      h.querySelector('.welcome-popup--mobile')
    );
    if (!host) return { err: 'no mobile welcome cart-reminder-popup' };
    const modal = host.querySelector('.welcome-popup--mobile');
    host.dataset.enabled = 'true';
    modal.classList.add('is-open');
    if (typeof host.armDeferredMedia === 'function') host.armDeferredMedia();
    document.querySelectorAll('#shopify-pc__banner,[id*=cookie]').forEach((n) => n.remove());
    const media = modal.querySelector('.cart-reminder-popup__media');
    const img = media?.querySelector('img');
    if (img?.dataset.myprintsyDeferSrc && !img.getAttribute('src')) {
      img.src = img.dataset.myprintsyDeferSrc;
      if (img.dataset.myprintsyDeferSrcset) img.srcset = img.dataset.myprintsyDeferSrcset;
    }
    if (img && !img.complete) {
      await new Promise((r) => {
        img.addEventListener('load', r, { once: true });
        img.addEventListener('error', r, { once: true });
        setTimeout(r, 5000);
      });
    }
    const m = getComputedStyle(media);
    const i = img ? getComputedStyle(img) : null;
    const mr = media.getBoundingClientRect();
    const ir = img ? img.getBoundingClientRect() : null;
    const fill = mr.width > 0 && ir ? +(ir.width / mr.width).toFixed(2) : null;
    return {
      mediaAspect: m.aspectRatio,
      mediaH: Math.round(mr.height),
      mediaW: Math.round(mr.width),
      imgFit: i?.objectFit,
      imgH: ir ? Math.round(ir.height) : null,
      imgW: ir ? Math.round(ir.width) : null,
      naturalW: img?.naturalWidth || 0,
      naturalH: img?.naturalHeight || 0,
      ratio: ir && ir.height ? +(ir.width / ir.height).toFixed(2) : null,
      fillRatio: fill,
      src: (img?.currentSrc || img?.src || '').slice(-80),
    };
  });

  assert.ok(!data.err, data.err);
  assert.ok(data.imgFit === 'contain', `object-fit contain got ${data.imgFit}`);
  assert.ok(
    !data.mediaAspect || data.mediaAspect === 'auto' || data.mediaAspect === 'none',
    `no forced 1/1 aspect got ${data.mediaAspect}`
  );
  // Happy: landscape banner renders wider than tall, nearly full media width
  if (data.naturalW > data.naturalH && data.ratio) {
    assert.ok(data.ratio >= 1.3, `rendered landscape ratio ${data.ratio} (nat ${data.naturalW}x${data.naturalH})`);
    assert.ok(data.fillRatio >= 0.95, `img fills media width got ${data.fillRatio}`);
  }
  // Fail branch: old 1/1 cover would keep square media — ensure we did not
  assert.ok(
    Math.abs(data.mediaW / data.mediaH - 1) > 0.15,
    `media must not stay square (1/1 cover) got ${data.mediaW}x${data.mediaH}`
  );

  await page.screenshot({ path: 'scripts/_shots/welcome-media-fit-mobile.png', fullPage: false });
  console.log('PASS', data);
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
