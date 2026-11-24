/**
 * Welcome Step2 mobile media: landscape banner must use contain (not 1/1 cover crop).
 *   node scripts/check-welcome-step2-media-fit.js
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
  await page.waitForTimeout(1500);

  const data = await page.evaluate(() => {
    const host = [...document.querySelectorAll('welcome-step2-popup')].find((h) =>
      h.querySelector('.welcome-step2--mobile')
    );
    const modal = host.querySelector('.welcome-step2--mobile');
    host.dataset.enabled = 'true';
    modal.classList.add('is-open');
    document.querySelectorAll('#shopify-pc__banner,[id*=cookie]').forEach((n) => n.remove());
    const media = modal.querySelector('.success-opt-in-popup__media');
    const img = media?.querySelector('img');
    const m = getComputedStyle(media);
    const i = img ? getComputedStyle(img) : null;
    const mr = media.getBoundingClientRect();
    const ir = img ? img.getBoundingClientRect() : null;
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
    };
  });

  assert.ok(data.imgFit === 'contain', `object-fit contain got ${data.imgFit}`);
  assert.ok(
    !data.mediaAspect || data.mediaAspect === 'auto' || data.mediaAspect === 'none',
    `no forced 1/1 aspect got ${data.mediaAspect}`
  );
  // Landscape banner should render wider than tall (not square crop)
  if (data.naturalW > data.naturalH && data.ratio) {
    assert.ok(data.ratio >= 1.3, `rendered landscape ratio ${data.ratio} (nat ${data.naturalW}x${data.naturalH})`);
  }

  await page.screenshot({ path: 'scripts/_shots/step2-media-fit-mobile.png' });
  console.log('PASS', data);
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
