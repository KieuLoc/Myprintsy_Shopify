/**
 * body.overflow-hidden left behind without a visible overlay must not block scrolling,
 * while a really visible popup must keep the page locked.
 *   THEME=186878558524 node scripts/check-scroll-lock-guard.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/products/christmas-cabin-light-area-rug-ncu0dv8793?preview_theme_id=${THEME}`;

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1440, height: 900 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36', welcome: '.overlay-section--welcome-desktop cart-reminder-popup' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', welcome: '.overlay-section--welcome-mobile cart-reminder-popup' },
];

async function tryScroll(page, vp) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  if (vp.isMobile) {
    // A finger touch without tapping anything (tapping the popup backdrop would close it).
    await page.evaluate(() => document.body.dispatchEvent(new Event('touchstart', { bubbles: true })));
    await page.waitForTimeout(150);
  }
  // window.scrollBy ignores overflow:hidden, so measure with real wheel input.
  await page.mouse.move(vp.viewport.width / 2, vp.viewport.height / 2);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(150);
  await page.mouse.wheel(0, 500);
  await page.waitForTimeout(300);
  return page.evaluate(() => ({ y: Math.round(window.scrollY), locked: document.body.classList.contains('overflow-hidden') }));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage(vp);
    await page.route('**/ip-blocker-embed*', (r) => r.abort());
    // Keep the timed Welcome popup out of the way; each case opens it explicitly.
    await page.addInitScript(() => {
      localStorage.setItem('welcome-popup', String(Date.now()));
      sessionStorage.setItem('welcome-popup-session-shown', '1');
    });
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('variant-selects input[type=radio]', { timeout: 30000 });
    await page.waitForTimeout(2500);
    await page.evaluate(() => document.querySelector('.shopify-pc__banner__dialog, #shopify-pc__banner')?.remove());

    // Real flow: switch sizes many times, page must stay scrollable.
    const ids = await page.$$eval('variant-selects input[type=radio]', (els) => els.map((e) => e.id));
    for (let i = 0; i < 8; i++) {
      await page.locator(`label[for="${ids[i % ids.length]}"]`).click({ force: true });
      await page.waitForTimeout(400);
    }
    let r = await tryScroll(page, vp);
    assert.ok(r.y > 80, `${vp.name}: đổi size 8 lần rồi cuộn chỉ tới ${r.y}px`);
    console.log(`PASS ${vp.name} đổi size 8 lần: cuộn tới ${r.y}px`);

    // Orphan lock: class on body, nothing open.
    await page.evaluate(() => document.body.classList.add('overflow-hidden'));
    r = await tryScroll(page, vp);
    assert.ok(!r.locked && r.y > 80, `${vp.name}: khóa mồ côi — locked=${r.locked}, cuộn tới ${r.y}px`);
    console.log(`PASS ${vp.name} khóa mồ côi: tự gỡ, cuộn tới ${r.y}px`);

    // Popup marked open but hidden (section display:none) — what the user sees as a blank lock.
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.closest('.shopify-section').style.display = 'none';
      return el.open(true);
    }, vp.welcome);
    await page.waitForTimeout(400);
    r = await tryScroll(page, vp);
    assert.ok(!r.locked && r.y > 80, `${vp.name}: popup ẩn mà vẫn is-open — locked=${r.locked}, cuộn tới ${r.y}px`);
    console.log(`PASS ${vp.name} popup is-open nhưng ẩn: tự gỡ, cuộn tới ${r.y}px`);
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      el.close(false, { skipTeaser: true });
      el.closest('.shopify-section').style.display = '';
    }, vp.welcome);

    // Visible popup: lock must hold.
    await page.evaluate((sel) => document.querySelector(sel).open(true), vp.welcome);
    await page.waitForTimeout(600);
    r = await tryScroll(page, vp);
    assert.ok(r.locked && r.y < 20, `${vp.name}: popup đang hiện mà trang vẫn cuộn — locked=${r.locked}, y=${r.y}px`);
    console.log(`PASS ${vp.name} popup hiện thật: vẫn khóa, y=${r.y}px`);

    await page.close();
  }
  await browser.close();
  console.log('ALL PASS');
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
