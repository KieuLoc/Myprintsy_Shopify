/**
 * Check: popup opens right on click; if the form never submits it must self-close by 15s.
 * A) required "Add Box" untouched -> Customily swallows click -> popup opens, closes <= ~17s.
 * B) option ticked -> popup opens on click, submit ~3s, popup still open + View Cart unlocked.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const PATH = '/products/pickleball-lover-personalized-mug-pklaah2a03';
const url = (theme) => `${BASE}${PATH}?variant=53039180513596&preview_theme_id=${theme}`;

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

async function run(browser, { tickBox, theme }) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.addInitScript(HIDE_OVERLAY);
  await page.goto(url(theme), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(9000);

  await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('label,input,li,div')).find((n) =>
      /pack\s*5/i.test((n.textContent || n.value || '').slice(0, 40))
    );
    if (el) el.click();
  });
  await page.waitForTimeout(4500);

  await page.evaluate(() => {
    Array.from(document.querySelectorAll('input[type="text"]'))
      .filter((el) => el.offsetParent !== null && /name/i.test(el.name + el.id))
      .slice(0, 5)
      .forEach((el, i) => {
        el.removeAttribute('readonly');
        el.value = 'Test' + (i + 1);
        ['input', 'change', 'blur'].forEach((e) => el.dispatchEvent(new Event(e, { bubbles: true })));
      });
  });
  await page.waitForTimeout(4000);

  if (tickBox) {
    await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]')).filter((r) =>
        /Add Box for Protection/i.test(r.name)
      );
      const last = radios[radios.length - 1];
      if (!last) return;
      (last.closest('label') || last).click();
      if (!last.checked) {
        last.checked = true;
        ['input', 'change'].forEach((e) => last.dispatchEvent(new Event(e, { bubbles: true })));
      }
    });
    await page.waitForTimeout(2500);
  }

  await page.evaluate(() => {
    window.__t0 = Date.now();
    window.__submitAt = null;
    window.__popupAt = null;
    const form = document.querySelector('product-form form[action*="/cart/add"]');
    form?.addEventListener('submit', () => (window.__submitAt = Date.now() - window.__t0), true);
    window.__closedAt = null;
    const n = document.getElementById('cart-notification');
    const iv = setInterval(() => {
      const on = n && n.classList.contains('active');
      if (window.__popupAt === null && on) window.__popupAt = Date.now() - window.__t0;
      if (window.__popupAt !== null && window.__closedAt === null && !on) window.__closedAt = Date.now() - window.__t0;
      if (Date.now() - window.__t0 > 22000) clearInterval(iv);
    }, 100);
    document.querySelector('product-form [type="submit"]')?.click();
  });

  await page.waitForTimeout(20000);
  const r = await page.evaluate(() => ({
    submitAt: window.__submitAt,
    popupAt: window.__popupAt,
    closedAt: window.__closedAt,
    btn: (document.getElementById('cart-notification-button')?.textContent || '').replace(/\s+/g, ' ').trim(),
  }));
  await page.close();
  return r;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const noBox = await run(browser, { tickBox: false, theme: 186878558524 });
  const withBox = await run(browser, { tickBox: true, theme: 186878558524 });
  await browser.close();
  console.log({ noBox, withBox });

  assert.strictEqual(noBox.submitAt, null, 'A: expected no submit when required option untouched');
  assert.ok(noBox.popupAt !== null && noBox.popupAt < 1500, `A: popup must open on click, got ${noBox.popupAt}ms`);
  assert.ok(
    noBox.closedAt !== null && noBox.closedAt < 17000,
    `A: popup must self-close by ~15s, closedAt=${noBox.closedAt}`
  );
  assert.ok(withBox.popupAt !== null && withBox.popupAt < 1500, `B: popup on click, got ${withBox.popupAt}ms`);
  assert.ok(withBox.submitAt, 'B: expected form submit when option ticked');
  assert.strictEqual(withBox.closedAt, null, 'B: popup must stay open after a successful add');
  assert.ok(/view cart/i.test(withBox.btn), `B: View Cart must unlock, got "${withBox.btn}"`);
  console.log('OK — popup instant, self-closes at 15s when add never happens');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
