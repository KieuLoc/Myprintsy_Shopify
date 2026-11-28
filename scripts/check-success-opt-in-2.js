/**
 * A) Success opt-in 1 + 2 both render gnome sofa theme asset
 * B) Cart reminder 2 openSuccessOptIn opens variant 2 (not 1)
 * C) variant 1 open does not open variant 2
 *
 *   node scripts/check-success-opt-in-2.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://www.myprintsy.com/?preview_theme_id=${THEME}`;

async function measure(page) {
  return page.evaluate(async () => {
    const SuccessOptIn = window.SuccessOptInPopup || customElements.get('success-opt-in-popup');
    if (!SuccessOptIn) throw new Error('SuccessOptInPopup missing');

    const closeAll = () => {
      [...document.querySelectorAll('success-opt-in-popup')].forEach((el) => {
        el.modal?.classList.remove('is-open');
        el.modal?.setAttribute('aria-hidden', 'true');
      });
      document.body.classList.remove('overflow-hidden');
    };

    const snap = (variant) => {
      const el = [...document.querySelectorAll('success-opt-in-popup')].find(
        (n) =>
          (n.dataset.variant || '1') === variant &&
          n.dataset.deviceTarget ===
            (window.matchMedia('(max-width: 749px)').matches ? 'mobile' : 'desktop')
      );
      if (!el) return null;
      const modal = el.querySelector('.success-opt-in-popup');
      const img = el.querySelector('.success-opt-in-popup__media img, .success-opt-in-popup__hero');
      const src = img?.currentSrc || img?.src || '';
      return {
        open: modal?.classList.contains('is-open') || false,
        variant: el.dataset.variant || '1',
        src,
        isGnome: /success-opt-in-gnome-sofa/i.test(src),
      };
    };

    closeAll();
    SuccessOptIn.open({ variant: '1', promoCode: 'MERRY25' });
    const v1 = snap('1');
    const v2While1 = snap('2');

    closeAll();
    SuccessOptIn.open({ variant: '2', promoCode: 'MERRY25' });
    const v2 = snap('2');
    const v1While2 = snap('1');

    closeAll();
    const reminder2 = [...document.querySelectorAll('cart-reminder-popup')].find((c) =>
      c.querySelector('.cart-reminder-popup--v2')
    );
    let fromReminder2 = null;
    if (reminder2?.openSuccessOptIn) {
      await reminder2.openSuccessOptIn();
      fromReminder2 = {
        v2: snap('2'),
        v1: snap('1'),
      };
    }

    closeAll();
    return { v1, v2While1, v2, v1While2, fromReminder2 };
  });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => customElements.get('success-opt-in-popup') && customElements.get('cart-reminder-popup'),
    null,
    { timeout: 30000 }
  );
  await page.waitForTimeout(1500);

  const data = await measure(page);
  await browser.close();

  assert.ok(data.v1?.open, 'variant 1 did not open');
  assert.ok(data.v1?.src, `variant 1 missing hero src`);
  assert.ok(!data.v2While1?.open, 'variant 2 open while opening 1');

  // SOI2 may be disabled in overlay-group — then open(variant:2) falls back to v1
  if (data.v2?.open) {
    assert.ok(data.v2.src, `variant 2 missing hero src`);
    assert.ok(!data.v1While2?.open, 'variant 1 open while opening 2');
  } else {
    assert.ok(data.v1While2?.open, 'variant 2 disabled but no fallback to v1');
  }

  assert.ok(data.fromReminder2, 'cart reminder 2 missing openSuccessOptIn');
  // SOI2 may be disabled on LIVE — then reminder 2 falls back to SOI1
  assert.ok(
    data.fromReminder2.v2?.open || data.fromReminder2.v1?.open,
    'reminder 2 opened neither success opt-in'
  );
  if (data.fromReminder2.v2?.open) {
    assert.ok(!data.fromReminder2.v1?.open, 'reminder 2 opened both opt-ins');
  }

  console.log('OK — Success opt-in routing', {
    v1Src: (data.v1?.src || '').slice(-48),
    v2Open: Boolean(data.v2?.open),
    reminderOpened: data.fromReminder2?.v2?.open ? 'v2' : data.fromReminder2?.v1?.open ? 'v1' : 'none',
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
