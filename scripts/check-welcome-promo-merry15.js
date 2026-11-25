/**
 * Welcome step1 + step2 show promo MERRY15 (welcome only; cart/success untouched).
 *   node scripts/check-welcome-promo-merry15.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => customElements.get('cart-reminder-popup') && customElements.get('welcome-step2-popup'),
    null,
    { timeout: 30000 }
  );

  const data = await page.evaluate(() => {
    const welcome = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey === 'welcome-popup' && c.matchesDeviceTarget()
    );
    const step2 = [...document.querySelectorAll('welcome-step2-popup')].find((c) =>
      c.matchesDeviceTarget ? c.matchesDeviceTarget() : c.dataset.deviceTarget === 'desktop'
    );
    const reminder = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );

    welcome?.modal?.classList.add('is-open');
    const step1Code = welcome?.querySelector('.welcome-popup__code')?.textContent?.trim() || '';
    const step1Attr = welcome?.querySelector('[data-welcome-promo-code]')?.getAttribute('data-welcome-promo-code') || '';

    step2?.modal?.classList.add('is-open');
    const step2Code =
      step2?.querySelector('[data-welcome-step2-code]')?.textContent?.trim() ||
      step2?.querySelector('.welcome-step2__code')?.textContent?.trim() ||
      '';
    const step2Dataset = (step2?.dataset.promoCode || '').trim();

    return {
      step1Code,
      step1Attr,
      step2Code,
      step2Dataset,
      cartFilled: (reminder?.dataset.promoCodeFilled || '').trim(),
      cartEmpty: (reminder?.dataset.promoCodeEmpty || '').trim(),
    };
  });

  await browser.close();
  console.log(data);

  assert.strictEqual(data.step1Code, 'MERRY15', `step1 code: ${data.step1Code}`);
  assert.strictEqual(data.step1Attr, 'MERRY15', `step1 attr: ${data.step1Attr}`);
  assert.strictEqual(data.step2Code, 'MERRY15', `step2 code: ${data.step2Code}`);
  assert.strictEqual(data.step2Dataset, 'MERRY15', `step2 dataset: ${data.step2Dataset}`);
  assert.strictEqual(data.cartFilled, 'MERRY25', `cart filled must stay MERRY25, got ${data.cartFilled}`);
  assert.strictEqual(data.cartEmpty, 'XMAS25', `cart empty must stay XMAS25, got ${data.cartEmpty}`);
  console.log('OK — Welcome step1+step2 MERRY15; cart codes unchanged');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
