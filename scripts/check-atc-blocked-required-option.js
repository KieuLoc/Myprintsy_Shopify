/**
 * Required Customily options gate the ATC popup:
 *   - one unanswered  -> no popup, the page scrolls to that option (Customily would block the
 *     submit anyway, and a popup opened then hangs at "Loading…" until the 15s ceiling)
 *   - all answered    -> popup opens as before
 *
 *   $env:BASE_URL='https://myprintsy-3.myshopify.com'; $env:PREVIEW_THEME_ID='186878558524'
 *   node scripts/check-atc-blocked-required-option.js
 */
const assert = require('node:assert');
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE_URL || 'https://www.myprintsy.com';
const PATH =
  '/products/pickleball-lover-personalized-mug-pklaah2a03?variant=53039180513596' +
  (process.env.PREVIEW_THEME_ID ? `&preview_theme_id=${process.env.PREVIEW_THEME_ID}` : '');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext(devices['iPhone 13']);
  const page = await ctx.newPage();
  // The region-restrictions app bounces automated visits to google.com.
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(`
    const s = document.createElement('style');
    s.textContent = 'welcome-popup,welcome-step2-popup,cart-reminder-popup,.shopify-pc__banner,' +
      '#shopify-pc__banner,div[class*="kl-private-reset"]{display:none!important;pointer-events:none!important}';
    document.documentElement.appendChild(s);`);

  const adds = [];
  page.on('request', (r) => /\/cart\/add/i.test(r.url()) && adds.push(r.method()));

  await page.goto(BASE + PATH, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('product-info', { timeout: 30000 });
  await page.waitForTimeout(13000);

  // Pack 1 + a name, but deliberately leave the required swatch option untouched.
  await page.evaluate(() => {
    const l = Array.from(document.querySelectorAll('variant-selects label')).find((x) =>
      /^\s*Pack 1(?!\d)/i.test(x.textContent.replace(/\s+/g, ' ').trim())
    );
    if (l) l.click();
  });
  await page.waitForTimeout(5000);
  await page.evaluate(() => {
    const el = document.querySelector('.customily_option input[type="text"], input[name*="Enter Name" i]');
    if (!el) return;
    el.removeAttribute('readonly');
    el.removeAttribute('disabled');
    el.focus();
    el.value = 'adasd';
    ['input', 'change', 'keyup', 'blur'].forEach((e) => el.dispatchEvent(new Event(e, { bubbles: true })));
  });
  await page.waitForTimeout(4000);

  const unanswered = await page.evaluate(
    () =>
      Array.from(document.querySelectorAll('.customily_option')).filter((opt) => {
        const radios = Array.from(opt.querySelectorAll('input[type="radio"]'));
        return radios.length && !radios.some((r) => r.checked);
      }).length
  );
  assert.ok(unanswered > 0, 'test setup: expected at least one unanswered required option');

  const clickAtc = () =>
    page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('product-form button[type="submit"], button[name="add"]')).find(
        (x) => x.offsetParent !== null && !x.disabled
      );
      if (b) b.click();
    });

  // --- branch 1: required option unanswered ---------------------------------
  await clickAtc();
  await page.waitForTimeout(3000);

  const blocked = await page.evaluate(() => {
    const opt = Array.from(document.querySelectorAll('.customily_option')).find((o) => {
      const radios = Array.from(o.querySelectorAll('input[type="radio"]'));
      return radios.length && !radios.some((r) => r.checked);
    });
    const r = opt ? opt.getBoundingClientRect() : null;
    return {
      popupOpen: !!document.querySelector('.cart-notification-wrapper.is-open'),
      optionInViewport: !!r && r.top < window.innerHeight && r.bottom > 0,
      optionTop: r ? Math.round(r.top) : null,
    };
  });
  await page.screenshot({ path: 'scripts/.out-blocked-option.png' });

  // --- branch 2: answer it, then the popup must open ------------------------
  await page.evaluate(() => {
    document.querySelectorAll('.customily_option').forEach((opt) => {
      const radios = Array.from(opt.querySelectorAll('input[type="radio"]'));
      if (!radios.length || radios.some((r) => r.checked)) return;
      opt.querySelector('label[role="button"]')?.click();
      const first = radios[0];
      const label = opt.querySelector(`label[for="${first.id}"]`) || first.closest('.customily-swatch')?.querySelector('label');
      if (label) label.click();
      else {
        first.click();
        first.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
  await page.waitForTimeout(2500);

  const t1 = Date.now();
  await clickAtc();
  const answeredOpened = await page
    .waitForSelector('.cart-notification-wrapper.is-open', { timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  const openedAt = ((Date.now() - t1) / 1000).toFixed(2);

  await browser.close();

  console.log({ unanswered, blocked, answeredOpened, openedAt: `${openedAt}s`, cartAdds: adds });

  assert.deepStrictEqual(adds, [], `blocked submit must not reach /cart/add, saw ${adds.join(',')}`);
  assert.strictEqual(blocked.popupOpen, false, 'popup opened while a required option was unanswered');
  assert.ok(blocked.optionInViewport, `missing option was not scrolled into view (top ${blocked.optionTop}px)`);
  assert.ok(answeredOpened, `popup did not open after every required option was answered (${openedAt}s)`);
  console.log(`OK — unanswered: no popup + option in view; answered: popup opens in ${openedAt}s`);
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
