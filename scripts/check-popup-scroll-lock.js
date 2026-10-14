/**
 * Check: welcome popup backdrop covers the screen, clicking it (or X) closes the popup
 * and the page scrolls again — desktop + mobile.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const UA = {
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  mobile: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
};
const OPEN = '.welcome-popup.is-open';

const status = (page) => page.evaluate((sel) => {
  const ov = document.querySelector(`${sel} .cart-reminder-popup__overlay`);
  const r = ov?.getBoundingClientRect();
  return {
    open: !!document.querySelector(sel),
    locked: document.body.classList.contains('overflow-hidden'),
    overlay: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : 'none',
    cover: r ? r.width >= innerWidth - 1 && r.height >= innerHeight - 1 : false,
  };
}, OPEN);

async function canScroll(page) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(200, 400);
  await page.mouse.wheel(0, 800);
  await page.waitForTimeout(600);
  return page.evaluate(() => window.scrollY);
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  for (const device of ['desktop', 'mobile']) {
    for (const how of ['backdrop', 'close X']) {
      const name = `${device} / close by ${how}`;
      const ctx = await browser.newContext(device === 'mobile'
        ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: UA.mobile }
        : { viewport: { width: 1440, height: 900 }, userAgent: UA.desktop });
      const page = await ctx.newPage();
      try {
        await page.goto(`${BASE}/?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
        await page.waitForSelector(OPEN, { timeout: 45000 });
        await page.waitForTimeout(800);
        const s0 = await status(page);
        assert.ok(s0.locked, `${name}: popup open but page not scroll-locked`);
        assert.ok(s0.cover, `${name}: backdrop is ${s0.overlay}, should cover viewport`);
        const t0 = Date.now();
        if (how === 'backdrop') {
          if (device === 'mobile') await page.touchscreen.tap(8, 8); else await page.mouse.click(8, 8);
        } else {
          await page.locator(`${OPEN} .cart-reminder-popup__close`).click({ timeout: 4000 });
        }
        await page.waitForFunction((sel) => !document.querySelector(sel), OPEN, { timeout: 3000 });
        const ms = Date.now() - t0;
        const s1 = await status(page);
        assert.ok(!s1.locked, `${name}: popup closed but body still overflow-hidden`);
        const y = await canScroll(page);
        assert.ok(y > 100, `${name}: page scrolled only ${y}px after closing popup`);
        console.log(`PASS ${name}: backdrop ${s0.overlay}, closed in ${ms}ms, scrolled ${y}px`);
      } catch (e) {
        failed++;
        console.log(`FAIL ${name}: ${e.message.split('\n')[0]}`);
      } finally {
        await ctx.close();
      }
    }
  }
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
