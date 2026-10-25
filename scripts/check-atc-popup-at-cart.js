/**
 * ATC popup sits under the header cart icon.
 * A) icon visible: card top is just below the icon, right edges line up
 * B) icon hidden: card stays in the top-right of the viewport
 *
 *   node scripts/check-atc-popup-at-cart.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = '186878558524';
const URL = 'https://www.myprintsy.com/?preview_theme_id=' + THEME;

function measure() {
  const icon = document.getElementById('cart-icon-bubble');
  const card = document.getElementById('cart-notification');
  const iconRect = icon ? icon.getBoundingClientRect() : null;
  const cardRect = card ? card.getBoundingClientRect() : null;
  return {
    open: Boolean(document.querySelector('.cart-notification-wrapper.is-open')),
    icon: iconRect
      ? { top: iconRect.top, bottom: iconRect.bottom, right: iconRect.right, width: iconRect.width }
      : null,
    card: cardRect
      ? { top: cardRect.top, bottom: cardRect.bottom, left: cardRect.left, right: cardRect.right, width: cardRect.width }
      : null,
    viewWidth: document.documentElement.clientWidth,
    viewHeight: window.innerHeight,
  };
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#cart-icon-bubble', { timeout: 30000 });
  await page.waitForFunction(() => customElements.get('cart-notification'), null, { timeout: 20000 });

  const openPopup = () =>
    page.evaluate(() => {
      document.querySelector('cart-notification').open();
    });

  await openPopup();
  await page.waitForTimeout(400);
  const desktop = await page.evaluate(measure);
  const desktopGap = desktop.card.top - desktop.icon.bottom;
  const desktopRight = Math.abs(desktop.card.right - desktop.icon.right);

  await page.evaluate(() => {
    document.getElementById('cart-icon-bubble').style.display = 'none';
    window.dispatchEvent(new Event('resize'));
  });
  await page.waitForTimeout(100);
  const hidden = await page.evaluate(measure);

  await page.evaluate(() => {
    document.getElementById('cart-icon-bubble').style.display = '';
  });
  await page.setViewportSize({ width: 390, height: 800 });
  await page.waitForTimeout(400);
  const mobile = await page.evaluate(measure);
  const mobileGap = mobile.card.top - mobile.icon.bottom;
  const mobileRight = Math.abs(mobile.card.right - mobile.icon.right);

  await browser.close();

  console.log({ desktop, hidden, mobile, desktopGap, desktopRight, mobileGap, mobileRight });

  assert.ok(desktop.open, 'desktop popup did not open');
  assert.ok(desktopGap >= 4 && desktopGap <= 16, `desktop gap ${desktopGap}px (want 8)`);
  assert.ok(desktopRight <= 16, `desktop right edges off by ${desktopRight}px`);
  assert.ok(desktop.card.top >= desktop.icon.bottom, 'desktop card covers the cart icon');

  assert.ok(hidden.open, 'popup closed when the cart icon was hidden');
  assert.ok(hidden.card.top >= 8 && hidden.card.top <= 20, `hidden-icon top ${hidden.card.top}px`);
  assert.ok(hidden.card.left >= 0, `hidden-icon card left ${hidden.card.left}px`);
  assert.ok(hidden.card.right <= hidden.viewWidth + 1, `hidden-icon card right ${hidden.card.right}px`);

  assert.ok(mobile.open, 'mobile popup did not open');
  assert.ok(mobileGap >= 4 && mobileGap <= 16, `mobile gap ${mobileGap}px (want 8)`);
  assert.ok(mobileRight <= 16, `mobile right edges off by ${mobileRight}px`);
  assert.ok(mobile.card.left >= 0, `mobile card left ${mobile.card.left}px`);
  assert.ok(mobile.card.right <= mobile.viewWidth + 1, `mobile card right ${mobile.card.right}px`);

  console.log(
    `OK — desktop gap ${desktopGap}px, right Δ ${desktopRight}px; hidden-icon top ${hidden.card.top}px; mobile gap ${mobileGap}px, right Δ ${mobileRight}px`
  );
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
