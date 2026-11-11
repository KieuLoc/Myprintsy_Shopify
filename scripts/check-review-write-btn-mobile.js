// Mobile: Judge.me "Write a review" sits top-right beside "Customer Reviews". Desktop: unchanged (below the media gallery).
// THEME=183186358588 node scripts/check-review-write-btn-mobile.js  (default DEV)
const assert = require('assert');
const { chromium, devices } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://www.myprintsy.com/products/golden-boughs-3-piece-quilted-bedding-set-ncu0dv8472?preview_theme_id=${THEME}`;

async function measure(browser, ctxOpts, shot) {
  const page = await browser.newPage(ctxOpts);
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  const btnSel = '#judgeme_product_reviews [data-testid="write-review-button"]';
  await page.waitForSelector(btnSel, { timeout: 40000 });
  await page.evaluate(() => document.querySelector('#judgeme_product_reviews').scrollIntoView());
  await page.waitForTimeout(2500);
  const m = await page.evaluate((sel) => {
    const box = (el) => el && el.getBoundingClientRect().toJSON();
    const w = document.querySelector('#judgeme_product_reviews');
    const title = w.querySelector('.jm-review-widget-sidebar-header__title');
    const range = document.createRange();
    range.selectNodeContents(title);
    return {
      small: w.classList.contains('jdgm-review-widget--small'),
      widget: box(w),
      btn: box(document.querySelector(sel)),
      title: box(title),
      titleText: range.getBoundingClientRect().toJSON(),
      media: box(w.querySelector('.jm-media-preview')),
    };
  }, btnSel);
  await page.locator('#judgeme_product_reviews').screenshot({ path: shot }).catch(() => {});
  await page.close();
  return m;
}

(async () => {
  const browser = await chromium.launch();
  try {
    const mob = await measure(browser, { ...devices['iPhone 13'] }, `${process.env.TEMP || '.'}/review-btn-mobile.png`);
    assert.ok(mob.small, 'mobile widget phai co class jdgm-review-widget--small');
    assert.ok(mob.btn.top < mob.media.top, `mobile: nut top ${mob.btn.top} phai tren dai anh ${mob.media.top}`);
    assert.ok(Math.abs(mob.btn.top - mob.title.top) < 12, `mobile: nut lech tieu de ${Math.round(mob.btn.top - mob.title.top)}px`);
    assert.ok(Math.abs(mob.widget.right - mob.btn.right) < 20, `mobile: nut cach mep phai ${Math.round(mob.widget.right - mob.btn.right)}px`);
    assert.ok(mob.titleText.right <= mob.btn.left, `mobile: chu tieu de (${Math.round(mob.titleText.right)}) de len nut (${Math.round(mob.btn.left)})`);
    console.log('mobile PASS', { btnTop: Math.round(mob.btn.top - mob.title.top), gapRight: Math.round(mob.widget.right - mob.btn.right), gapText: Math.round(mob.btn.left - mob.titleText.right) });

    const desk = await measure(browser, { viewport: { width: 1440, height: 900 } }, `${process.env.TEMP || '.'}/review-btn-desktop.png`);
    assert.ok(!desk.small, 'desktop khong duoc co class --small');
    assert.ok(desk.btn.top > desk.media.bottom - 1, `desktop: nut top ${desk.btn.top} phai duoi dai anh ${desk.media.bottom}`);
    console.log('desktop PASS', { btnBelowMedia: Math.round(desk.btn.top - desk.media.bottom) });
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
