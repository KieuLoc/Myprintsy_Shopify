/**
 * Cart reminder 1h countdown: format + paint tick + Welcome skip.
 *
 * Branches:
 *   A) formatCountdown math (1h / mid / zero / negative)
 *   B) startCountdown paints ~01:00:00 then ticks down after 1.1s
 *   C) welcome-popup storage key must NOT paint a countdown
 *
 *   node scripts/check-cart-reminder-countdown.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'overlay-cart-reminder-popup.js');
const SRC = fs.readFileSync(ASSET, 'utf8');

assert.ok(SRC.includes('formatCountdown'), 'expected formatCountdown');
assert.ok(SRC.includes('data-cart-reminder-countdown') || SRC.includes('[data-cart-reminder-countdown]'), 'expected countdown selector');

const MARKUP = `
  <cart-reminder-popup data-storage-key="cart-reminder-popup" data-countdown-hours="1" data-enabled="false">
    <div class="cart-reminder-popup" aria-hidden="true">
      <span data-cart-reminder-countdown>01:00:00</span>
    </div>
  </cart-reminder-popup>
  <cart-reminder-popup data-storage-key="welcome-popup" data-countdown-hours="1" data-enabled="false">
    <div class="cart-reminder-popup" aria-hidden="true">
      <span data-cart-reminder-countdown>99:99:99</span>
    </div>
  </cart-reminder-popup>
`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.route('https://cart-reminder-countdown.check/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><html><body>${MARKUP}</body></html>`,
    })
  );
  await page.goto('https://cart-reminder-countdown.check/', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: SRC });
  await page.waitForFunction(() => !!customElements.get('cart-reminder-popup'));
  await page.evaluate(() => {
    document.querySelectorAll('cart-reminder-popup').forEach((el) => customElements.upgrade(el));
    localStorage.clear();
  });

  // A) format
  const formatCases = await page.evaluate(() => {
    const Cls = customElements.get('cart-reminder-popup');
    return [
      [3600000, Cls.formatCountdown(3600000)],
      [3661000, Cls.formatCountdown(3661000)],
      [0, Cls.formatCountdown(0)],
      [-1000, Cls.formatCountdown(-1000)],
    ];
  });
  assert.strictEqual(formatCases[0][1], '01:00:00', `1h got ${formatCases[0][1]}`);
  assert.strictEqual(formatCases[1][1], '01:01:01', `1h1m1s got ${formatCases[1][1]}`);
  assert.strictEqual(formatCases[2][1], '00:00:00', `0 got ${formatCases[2][1]}`);
  assert.strictEqual(formatCases[3][1], '00:00:00', `neg got ${formatCases[3][1]}`);

  // B) paint + tick
  const before = await page.evaluate(() => {
    const el = document.querySelector('cart-reminder-popup[data-storage-key="cart-reminder-popup"]');
    el.startCountdown();
    return el.querySelector('[data-cart-reminder-countdown]').textContent;
  });
  assert.ok(/^0[01]:\d{2}:\d{2}$/.test(before), `must start near 1h, got ${before}`);
  const beforeSec = before.split(':').reduce((acc, n, i) => acc + Number(n) * [3600, 60, 1][i], 0);
  assert.ok(beforeSec >= 3598 && beforeSec <= 3600, `start seconds ${beforeSec} not ~3600`);

  await page.waitForTimeout(1100);
  const after = await page.evaluate(() => {
    const el = document.querySelector('cart-reminder-popup[data-storage-key="cart-reminder-popup"]');
    const text = el.querySelector('[data-cart-reminder-countdown]').textContent;
    el.stopCountdown();
    return text;
  });
  const afterSec = after.split(':').reduce((acc, n, i) => acc + Number(n) * [3600, 60, 1][i], 0);
  assert.ok(afterSec < beforeSec, `must tick down (${before}=${beforeSec}s → ${after}=${afterSec}s)`);
  assert.ok(afterSec >= 3597 && afterSec <= 3599, `after ~1s expect ~3598s, got ${afterSec}`);

  // C) Welcome skip
  const welcomeText = await page.evaluate(() => {
    const el = document.querySelector('cart-reminder-popup[data-storage-key="welcome-popup"]');
    el.startCountdown();
    return el.querySelector('[data-cart-reminder-countdown]').textContent;
  });
  assert.strictEqual(welcomeText, '99:99:99', `Welcome must not paint countdown, got ${welcomeText}`);

  await browser.close();
  console.log(`OK — format + tick ${before}→${after}; Welcome skipped`);
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
