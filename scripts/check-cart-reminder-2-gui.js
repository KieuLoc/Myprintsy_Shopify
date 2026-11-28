/**
 * GUI verify: Cart reminder 2 sits bottom-left with the new card layout.
 * A) desktop has .cart-reminder-popup--v2 open under the fold, left-aligned
 * B) mobile same card, still bottom-left and in viewport
 *
 *   node scripts/check-cart-reminder-2-gui.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://www.myprintsy.com/?preview_theme_id=${THEME}`;

async function openV2(page) {
  return page.evaluate(async () => {
    const isMobile = window.matchMedia('(max-width: 749px)').matches;
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) =>
        c.querySelector('.cart-reminder-popup--v2') &&
        c.dataset.deviceTarget === (isMobile ? 'mobile' : 'desktop')
    );
    if (!el) throw new Error('Cart reminder 2 not on the page');

    for (const k of ['welcome-popup', 'cart-reminder-popup']) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(`${k}-session-shown`);
    }
    sessionStorage.setItem('welcome-popup-session-shown', '1');
    el.dataset.enabled = 'true';
    el.cartCount = Math.max(1, Number(el.dataset.cartCount || 0) || 1);
    await el.refreshCartItems();
    await el.open(true);

    const modal = el.querySelector('.cart-reminder-popup--v2');
    const dialog = el.querySelector('.cart-reminder-popup__dialog');
    // Assert visual visibility only — [hidden] can still paint if CSS loses specificity
    const headings = [...el.querySelectorAll('.cart-reminder-popup__heading')].filter(
      (h) => getComputedStyle(h).display !== 'none'
    );
    const heading = headings[0] || null;
    const promo = el.querySelector('.cart-reminder-popup__promo-title');
    const expires = el.querySelector('.cart-reminder-popup__promo-expires');
    const countdown = el.querySelector('[data-cart-reminder-countdown]');
    const button = el.querySelector('[data-cart-reminder-submit], .cart-reminder-popup__button');
    const themeDismiss = el.querySelectorAll('[data-cart-reminder-dismiss]');
    const maybeLaterNodes = [...el.querySelectorAll('button, a, [role="button"]')].filter((n) =>
      /maybe later/i.test((n.textContent || '').trim())
    );
    const rect = dialog.getBoundingClientRect();
    const cs = getComputedStyle(modal);
    const headingCs = heading ? getComputedStyle(heading) : null;
    const dialogCs = getComputedStyle(dialog);
    const headingText = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : '';

    const countdownCs = countdown ? getComputedStyle(countdown) : null;

    return {
      open: modal.classList.contains('is-open'),
      heading: headingText,
      visibleHeadingCount: headings.length,
      waitingCount: (headingText.match(/waiting for you/gi) || []).length,
      headingSize: headingCs ? parseFloat(headingCs.fontSize) : 0,
      promo: promo && promo.textContent.trim(),
      expires: expires && expires.textContent.replace(/\s+/g, ' ').trim(),
      countdown: countdown && countdown.textContent.trim(),
      countdownColor: countdownCs ? countdownCs.color : '',
      countdownBg: countdownCs ? countdownCs.backgroundColor : '',
      button: button && button.textContent.replace(/\s+/g, ' ').trim(),
      hasSubmit: Boolean(
        el.querySelector('[data-cart-reminder-submit], .cart-reminder-popup__button, button[type="submit"]')
      ),
      themeDismissCount: themeDismiss.length,
      maybeLaterCount: maybeLaterNodes.length,
      bg: dialogCs.backgroundColor,
      top: rect.top,
      left: rect.left,
      bottom: rect.bottom,
      right: rect.right,
      width: rect.width,
      viewWidth: window.innerWidth,
      viewHeight: window.innerHeight,
      alignItems: cs.alignItems,
      justifyContent: cs.justifyContent,
      overlayBg: getComputedStyle(el.querySelector('.cart-reminder-popup__overlay')).backgroundColor,
    };
  });
}

async function check(browser, name, viewport) {
  const page = await browser.newPage({
    viewport,
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  const data = await openV2(page);
  await page.close();

  assert.ok(data.open, `${name} not open`);
  assert.ok(/waiting for you/i.test(data.heading || ''), `${name} heading: ${data.heading}`);
  assert.ok(/time is ticking/i.test(data.heading || ''), `${name} heading sub: ${data.heading}`);
  assert.strictEqual(data.visibleHeadingCount, 1, `${name} visible headings ${data.visibleHeadingCount}`);
  assert.strictEqual(data.waitingCount, 1, `${name} duplicated "waiting for you" x${data.waitingCount}`);
  assert.ok(/extra 10%/i.test(data.promo || ''), `${name} promo: ${data.promo}`);
  assert.ok(/expires in/i.test(data.expires || ''), `${name} expires: ${data.expires}`);
  assert.ok(/^\d{2}:\d{2}:\d{2}$/.test(data.countdown || ''), `${name} countdown: ${data.countdown}`);
  const parts = String(data.countdown || '').split(':').map(Number);
  const totalSec = parts[0] * 3600 + parts[1] * 60 + parts[2];
  assert.ok(totalSec > 0 && totalSec <= 5 * 60, `${name} countdown ${data.countdown} not within 5 min`);
  const cdColor = String(data.countdownColor).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(cdColor, `${name} countdown color ${data.countdownColor}`);
  assert.ok(
    +cdColor[1] < 180 && +cdColor[2] < 180 && +cdColor[3] < 180,
    `${name} countdown invisible/cream ${data.countdownColor}`
  );
  assert.ok(
    data.hasSubmit || /secure my cart/i.test(data.button || ''),
    `${name} missing submit (button=${data.button})`
  );
  assert.strictEqual(data.themeDismissCount, 0, `${name} theme Maybe Later still rendered`);
  assert.ok(data.maybeLaterCount <= 1, `${name} Maybe Later count ${data.maybeLaterCount}`);
  assert.ok(data.headingSize > 0 && data.headingSize <= 20, `${name} heading ${data.headingSize}px too big`);
  if (data.viewWidth >= 750) {
    assert.ok(data.width >= 400 && data.width <= 440, `${name} width ${data.width}px (want ~420)`);
  } else {
    // mobile card ~2/3 of (viewport - padding)
    const expected = (data.viewWidth - 20) * (2 / 3);
    assert.ok(
      data.width >= expected - 12 && data.width <= expected + 12,
      `${name} mobile width ${data.width}px (want ~${Math.round(expected)})`
    );
  }
  const bg = String(data.bg).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(bg, `${name} bg ${data.bg}`);
  assert.ok(+bg[1] > 200 && +bg[2] > 200 && +bg[3] > 180, `${name} bg not cream ${data.bg}`);
  assert.strictEqual(data.alignItems, 'flex-end', `${name} align ${data.alignItems}`);
  assert.strictEqual(data.justifyContent, 'flex-start', `${name} justify ${data.justifyContent}`);
  assert.ok(data.left < data.viewWidth * 0.35, `${name} left ${data.left} not near left edge`);
  assert.ok(data.bottom > data.viewHeight * 0.55, `${name} bottom ${data.bottom} not near bottom`);
  assert.ok(data.top >= 0 && data.left >= 0, `${name} off-screen top/left`);
  assert.ok(data.right <= data.viewWidth + 1, `${name} right ${data.right} > ${data.viewWidth}`);
  assert.ok(data.bottom <= data.viewHeight + 1, `${name} bottom ${data.bottom} > ${data.viewHeight}`);
  assert.ok(/rgba\(0,\s*0,\s*0,\s*0\)|transparent/i.test(data.overlayBg), `${name} overlay ${data.overlayBg}`);

  const height = Math.round(data.bottom - data.top);
  console.log(name, {
    left: Math.round(data.left),
    bottomGap: Math.round(data.viewHeight - data.bottom),
    width: Math.round(data.width),
    height,
    headingPx: data.headingSize,
    maybeLater: data.maybeLaterCount,
    countdown: data.countdown,
  });
  data.height = height;
  return data;
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const desktop = await check(browser, 'desktop', { width: 1440, height: 900 });
  const mobile = await check(browser, 'mobile', { width: 390, height: 800 });
  await browser.close();
  console.log(
    `OK — Cart reminder 2 bottom-left. Desktop left ${Math.round(desktop.left)}px, mobile left ${Math.round(mobile.left)}px`
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
