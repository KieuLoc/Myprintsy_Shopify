/**
 * Write a review must not leave the page unable to scroll.
 * 1) Body locked inline (the way the review popup pins it) — click unlocks, wheel moves.
 * 2) Compact review modal taller than the screen — the form itself scrolls.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = process.env.THEME || '186878558524';
const URL =
  'https://myprintsy-3.myshopify.com/products/best-trip-personalized-3d-christmas-acrylic-ornament-xmthah3o14?preview_theme_id=' +
  THEME;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 800 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('a.jdgm-write-rev-link', { timeout: 30000 });
  const btn = page.locator('a.jdgm-write-rev-link').first();
  await btn.scrollIntoViewIfNeeded();

  await page.evaluate(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = '0px';
    document.body.style.width = '100%';
  });
  const lockedY = await page.evaluate(() => Math.round(window.scrollY));
  await page.mouse.move(200, 200);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(200);
  const stillY = await page.evaluate(() => Math.round(window.scrollY));
  assert.ok(Math.abs(stillY - lockedY) < 40, `lúc đang khóa vẫn trượt ${lockedY}->${stillY}`);

  await page.evaluate(() => document.querySelector('a.jdgm-write-rev-link').click());
  await page.waitForTimeout(80);
  const unlocked = await page.evaluate(() => ({
    overflow: document.body.style.overflow,
    position: document.body.style.position,
  }));
  assert.equal(unlocked.overflow, '', `overflow còn "${unlocked.overflow}"`);
  assert.equal(unlocked.position, '', `position còn "${unlocked.position}"`);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(200);
  const freeY = await page.evaluate(() => Math.round(window.scrollY));
  assert.ok(freeY > stillY + 80, `sau click chỉ tới ${freeY}px (trước ${stillY})`);
  console.log(`PASS khóa body: wheel đứng ${stillY}px, sau click tới ${freeY}px`);

  const modal = await page.evaluate(() => {
    const box = document.createElement('div');
    box.className = 'jdgm-write-review-modal jdgm-write-review-modal--compact';
    box.style.display = 'block';
    box.innerHTML =
      '<div class="jdgm-write-review-modal__content" style="overflow:hidden;height:100dvh"><div style="height:2400px;min-height:2400px;flex-shrink:0">form</div></div>';
    document.body.appendChild(box);
    const content = box.querySelector('.jdgm-write-review-modal__content');
    const before = content.scrollTop;
    content.scrollTop = 600;
    const cs = getComputedStyle(content);
    return { before, after: content.scrollTop, overflowY: cs.overflowY, maxHeight: cs.maxHeight };
  });
  assert.ok(modal.after >= 400, `form modal không cuộn ${modal.before}->${modal.after} (${modal.overflowY}, max ${modal.maxHeight})`);
  console.log(`PASS modal compact: cuộn ${modal.before}->${modal.after}px, overflow ${modal.overflowY}`);

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
