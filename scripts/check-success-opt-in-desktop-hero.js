/**
 * GUI: Success opt-in desktop (v1 + v2 markup) uses reindeer bedding hero asset.
 *
 *   node scripts/check-success-opt-in-desktop-hero.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://www.myprintsy.com/?preview_theme_id=${THEME}`;

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('success-opt-in-popup'), null, {
    timeout: 30000,
  });

  const data = await page.evaluate(() => {
    const desks = [...document.querySelectorAll('success-opt-in-popup')].filter(
      (n) => n.dataset.deviceTarget === 'desktop'
    );
    const pick = (variant) =>
      desks.find((n) => (n.dataset.variant || '1') === variant) || null;
    const srcOf = (el) => {
      if (!el) return null;
      const img = el.querySelector('.success-opt-in-popup__hero, .success-opt-in-popup__media img');
      return img?.currentSrc || img?.src || null;
    };
    return {
      v1: srcOf(pick('1')),
      v2: srcOf(pick('2')),
      count: desks.length,
    };
  });
  await browser.close();

  assert.ok(data.count >= 1, `no desktop SOI (${data.count})`);
  assert.ok(
    /success-opt-in-reindeer-bedding/i.test(data.v1 || ''),
    `SOI1 desktop hero: ${data.v1}`
  );
  // v2 may be disabled in DOM still — if present, must use same asset
  if (data.v2) {
    assert.ok(
      /success-opt-in-reindeer-bedding/i.test(data.v2),
      `SOI2 desktop hero: ${data.v2}`
    );
  }

  console.log('OK — desktop SOI hero', { v1: data.v1, v2: data.v2 || '(section disabled/absent)' });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
