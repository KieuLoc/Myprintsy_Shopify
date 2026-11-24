/**
 * GUI verify: Cart Reminder heading copy + colors + fonts (desktop + mobile).
 *   node scripts/check-cart-reminder-heading-gui.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;

async function openEmptyReminder(page) {
  return page.evaluate(async () => {
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    assertOk(el, 'no cart-reminder on this viewport');
    for (const k of ['welcome-popup', 'cart-reminder-popup']) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(`${k}-session-shown`);
    }
    sessionStorage.setItem('welcome-popup-session-shown', '1');
    el.dataset.enabled = 'true';
    el.cartCount = 0;
    await el.refreshCartItems();
    el.modal.classList.add('is-open');
    const eyebrow = el.querySelector('.cart-reminder-popup__eyebrow:not([hidden])');
    const heading = el.querySelector('.cart-reminder-popup__heading:not([hidden])');
    const accent = heading && heading.querySelector('.cart-reminder-popup__heading-accent');
    const sub = el.querySelector('.cart-reminder-popup__subtext:not([hidden])');
    const strong = sub && sub.querySelector('strong');
    const cs = (n) => (n ? getComputedStyle(n) : null);
    const ey = cs(eyebrow);
    const hd = cs(heading);
    const ac = cs(accent);
    const sb = cs(sub);
    const st = cs(strong);
    return {
      eyebrow: eyebrow && eyebrow.textContent.trim(),
      headingText: heading && heading.textContent.replace(/\s+/g, ' ').trim(),
      accent: accent && accent.textContent.trim(),
      subtext: sub && sub.textContent.replace(/\s+/g, ' ').trim(),
      strong: strong && strong.textContent.trim(),
      eyebrowColor: ey && ey.color,
      headingColor: hd && hd.color,
      accentColor: ac && ac.color,
      subColor: sb && sb.color,
      strongColor: st && st.color,
      eyebrowFont: ey && ey.fontFamily,
      headingFont: hd && hd.fontFamily,
      subFont: sb && sb.fontFamily,
    };
    function assertOk(v, m) {
      if (!v) throw new Error(m);
    }
  });
}

function rgbClose(cssColor, r, g, b, tol = 25) {
  const m = String(cssColor).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(m, `parse color ${cssColor}`);
  const dr = Math.abs(+m[1] - r);
  const dg = Math.abs(+m[2] - g);
  const db = Math.abs(+m[3] - b);
  assert.ok(dr <= tol && dg <= tol && db <= tol, `color ${cssColor} ~ rgb(${r},${g},${b}) delta ${dr}/${dg}/${db}`);
}

function hasFont(family, needle) {
  assert.ok(String(family).toLowerCase().includes(needle.toLowerCase()), `font ${family} has ${needle}`);
}

async function checkViewport(browser, name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, { timeout: 30000 });
  const data = await openEmptyReminder(page);
  assert.strictEqual(data.eyebrow, 'Finish Your Order', `${name} eyebrow`);
  assert.ok(data.headingText.includes('And Save An Extra'), `${name} heading prefix: ${data.headingText}`);
  assert.ok(data.headingText.includes('15%'), `${name} heading 15%: ${data.headingText}`);
  assert.ok(data.headingText.includes('Off'), `${name} heading Off: ${data.headingText}`);
  assert.strictEqual(data.accent, '15%', `${name} accent`);
  assert.ok(data.subtext.includes('Secure your cart now'), `${name} subtext: ${data.subtext}`);
  assert.strictEqual(data.strong, 'Priority shipping', `${name} strong`);
  rgbClose(data.eyebrowColor, 17, 17, 17);
  rgbClose(data.headingColor, 122, 18, 21);
  rgbClose(data.accentColor, 197, 157, 70);
  rgbClose(data.subColor, 107, 101, 96);
  rgbClose(data.strongColor, 17, 17, 17);
  hasFont(data.eyebrowFont, 'Playfair');
  hasFont(data.headingFont, 'Playfair');
  hasFont(data.subFont, 'Poppins');
  await page.screenshot({
    path: `scripts/_shots/cart-reminder-heading-${name}.png`,
    fullPage: false,
  });
  await ctx.close();
  return data;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const desk = await checkViewport(browser, 'desktop', { width: 1366, height: 800 });
    const mob = await checkViewport(browser, 'mobile', { width: 390, height: 844 });
    console.log('PASS desktop', desk.eyebrow, desk.headingText, desk.accent, desk.strong);
    console.log('PASS mobile', mob.eyebrow, mob.headingText, mob.accent, mob.strong);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
