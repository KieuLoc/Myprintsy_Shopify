/**
 * PDP: review stars sit right under the price, the delivery ETA comes after the stars.
 *   THEME=186878558524 node scripts/check-stars-under-price.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = process.env.THEME || '186878558524';
const HANDLES = [
  'who-makes-the-rules-personalized-tumbler-cup-kdthah1o19', // Customily, no Buy More box
  'quilting-is-my-therapy-personalized-accent-mug-gift-for-crafters-swthah1o18', // Buy More box
  'christmas-cabin-light-area-rug-ncu0dv8793', // size picker
  'f-caw-f-crow-joke-ugly-christmas-sweater-personalized-ugly-sweater-cwlaht1o21', // sweater template
];
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function measure() {
  const info = document.querySelector('.product__info-container');
  const price = info.querySelector('[id^="price-"]');
  const badge = info.querySelector('.jdgm-preview-badge');
  const stars = badge && (badge.closest('.shopify-block') || badge);
  const eta = info.querySelector('.sb_ETA');
  const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
  return {
    template: document.body.className.match(/template-[\w-]+/)?.[0] || '',
    hasStars: !!stars,
    starsRightAfterPrice: !!stars && price.nextElementSibling === stars,
    etaFollowsPrice: !!eta && eta.closest('.custom_delivery_estimation_widget')?.previousElementSibling === price,
    priceBottom: Math.round(price.getBoundingClientRect().bottom + scrollY),
    starsTop: top(stars),
    starsHeight: stars ? Math.round(stars.getBoundingClientRect().height) : 0,
    starsText: stars ? stars.innerText.trim().slice(0, 30) : '',
    etaTop: top(eta),
  };
}

async function open(browser, handle, stripStars) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  const errors = [];
  page.on('pageerror', (e) => {
    if (/edd-pdp-placement/.test(e.stack || '')) errors.push(e.message);
  });
  await page.route('**/ip-blocker-embed*', (r) => r.abort());
  if (stripStars) {
    await page.route(`**/products/${handle}*`, async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(/jdgm-preview-badge/g, 'jdgm-preview-badge-off');
      await route.fulfill({ response: res, body });
    });
  }
  await page.goto(`https://myprintsy-3.myshopify.com/products/${handle}?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.product__info-container .sb_ETA', { timeout: 20000 });
  await page.waitForTimeout(3000);
  return { page, errors };
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const handle of HANDLES) {
    const { page, errors } = await open(browser, handle, false);
    const m = await page.evaluate(measure);
    const tag = `${handle.slice(0, 40)} (${m.template})`;
    assert.ok(m.hasStars, `${tag}: không thấy khối sao`);
    assert.ok(m.starsRightAfterPrice, `${tag}: sao không nằm ngay sau giá`);
    assert.ok(m.starsTop - m.priceBottom < 40, `${tag}: sao cách giá ${m.starsTop - m.priceBottom}px`);
    if (m.starsHeight) {
      assert.ok(m.etaTop >= m.starsTop + m.starsHeight, `${tag}: ETA y=${m.etaTop} nằm trên/đè sao y=${m.starsTop} cao ${m.starsHeight}`);
    } else {
      console.log(`  ${tag}: sản phẩm chưa có review, Judge.me ẩn khối sao (cao 0px)`);
    }
    assert.equal(errors.length, 0, `${tag}: lỗi JS ${errors.join(' | ')}`);
    console.log(`PASS ${tag}: giá đáy ${m.priceBottom}px → sao ${m.starsTop}px → ETA ${m.etaTop}px`);
    await page.close();
  }

  // No review badge on the page: ETA must still land right under the price, no JS error.
  const { page, errors } = await open(browser, HANDLES[0], true);
  const m = await page.evaluate(measure);
  assert.ok(!m.hasStars, 'không gỡ được badge để test nhánh thiếu sao');
  assert.ok(m.etaFollowsPrice, `không có sao: ETA không nằm ngay sau giá (ETA y=${m.etaTop}, giá đáy ${m.priceBottom})`);
  assert.equal(errors.length, 0, `không có sao: lỗi JS ${errors.join(' | ')}`);
  console.log(`PASS không có sao: ETA ngay sau giá (giá đáy ${m.priceBottom}px → ETA ${m.etaTop}px)`);
  await page.close();

  await browser.close();
  console.log('ALL PASS');
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
