/**
 * GUI: Cart Reminder double frame + real Klaviyo Get It Now (gold) / Maybe Later (burgundy outline).
 *   node scripts/check-cart-reminder-frame-buttons.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;

function rgbClose(label, cssColor, r, g, b, tol = 30) {
  const m = String(cssColor).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(m, `${label}: parse ${cssColor}`);
  assert.ok(
    Math.abs(+m[1] - r) <= tol && Math.abs(+m[2] - g) <= tol && Math.abs(+m[3] - b) <= tol,
    `${label}: ${cssColor} ~ rgb(${r},${g},${b})`
  );
}

async function openAndWaitKlaviyo(page) {
  await page.evaluate(async () => {
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    for (const k of ['welcome-popup', 'cart-reminder-popup']) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(`${k}-session-shown`);
    }
    sessionStorage.setItem('welcome-popup-session-shown', '1');
    el.dataset.enabled = 'true';
    el.cartCount = 0;
    await el.refreshCartItems();
    el.modal.classList.add('is-open');
  });

  await page.waitForFunction(
    () => {
      const el = [...document.querySelectorAll('cart-reminder-popup')].find(
        (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
      );
      const btns = [...(el?.querySelectorAll('button.klaviyo-form-button') || [])];
      return btns.length >= 2;
    },
    null,
    { timeout: 20000 }
  );

  return page.evaluate(() => {
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    document.querySelectorAll('#shopify-pc__banner,[id*=cookie]').forEach((n) => n.remove());
    const dialog = el.querySelector('.cart-reminder-popup__dialog');
    const primary = el.querySelector(
      '[data-testid="form-row"]:nth-child(2) button.klaviyo-form-button'
    );
    const secondary = el.querySelector(
      '[data-testid="form-row"]:nth-child(3) button.klaviyo-form-button'
    );
    const dCs = getComputedStyle(dialog);
    const pCs = getComputedStyle(primary);
    const sCs = getComputedStyle(secondary);
    return {
      dialogBorder: dCs.borderTopColor,
      dialogBorderW: dCs.borderTopWidth,
      boxShadow: dCs.boxShadow,
      primaryText: primary.textContent.trim(),
      primaryBg: pCs.backgroundColor,
      primaryColor: pCs.color,
      secondaryText: secondary.textContent.trim(),
      secondaryBorder: sCs.borderTopColor,
      secondaryBorderW: sCs.borderTopWidth,
      secondaryColor: sCs.color,
      secondaryBg: sCs.backgroundColor,
    };
  });
}

async function check(browser, name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${URL}&v=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, { timeout: 30000 });
  const data = await openAndWaitKlaviyo(page);
  assert.ok(parseFloat(data.dialogBorderW) >= 1, `${name} dialog border width`);
  rgbClose(`${name} dialog outer burgundy`, data.dialogBorder, 122, 18, 21);
  assert.ok(String(data.boxShadow).includes('inset'), `${name} inset frame`);
  assert.ok(/rgb\(\s*197\s*,\s*157\s*,\s*70\s*\)/.test(data.boxShadow), `${name} inner gold`);
  assert.ok(/get it now/i.test(data.primaryText), `${name} primary text ${data.primaryText}`);
  rgbClose(`${name} Get It Now bg`, data.primaryBg, 197, 157, 70);
  rgbClose(`${name} Get It Now text`, data.primaryColor, 17, 17, 17);
  assert.ok(/maybe later/i.test(data.secondaryText), `${name} secondary ${data.secondaryText}`);
  assert.ok(parseFloat(data.secondaryBorderW) >= 1, `${name} Maybe Later border`);
  rgbClose(`${name} Maybe Later border`, data.secondaryBorder, 122, 18, 21);
  rgbClose(`${name} Maybe Later text`, data.secondaryColor, 122, 18, 21);
  await page.screenshot({ path: `scripts/_shots/cart-reminder-frame-${name}.png` });
  await ctx.close();
  return data;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const d = await check(browser, 'desktop', { width: 1366, height: 900 });
    const m = await check(browser, 'mobile', { width: 390, height: 844 });
    console.log('PASS desktop', d.primaryBg, d.primaryColor, d.secondaryBorder);
    console.log('PASS mobile', m.primaryBg, m.primaryColor, m.secondaryBorder);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
