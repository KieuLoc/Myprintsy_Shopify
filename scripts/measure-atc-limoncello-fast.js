/**
 * Measure tap -> "Item has been added" modal on LIVE mobile (no CPU throttle).
 * Detects Customily confirm modal + cart-notification + network pipeline.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-sun-kissed-limoncello-personalized-accent-mug-upthth1l21';
const CPU_RATE = Number(process.env.ATC_CPU || 1);
const OUT = path.join(__dirname, '..', 'debug-atc-limoncello-fast.json');
const SHOT = path.join(__dirname, '..', 'debug-atc-limoncello-fast.png');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const iphone = devices['iPhone 13'];
  const context = await browser.newContext({
    ...iphone,
    locale: 'en-US',
  });
  const page = await context.newPage();

  if (CPU_RATE > 1) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });
  }

  let clickAt = 0;
  const log = [];
  const keep = /cart\/add|cart\.js|customily|amazonaws|cloudfront|storage|EPSEngrave|preview\/url/i;
  page.on('request', (r) => {
    if (!clickAt || !keep.test(r.url())) return;
    log.push({ p: 'req', rel: Date.now() - clickAt, m: r.method(), url: r.url().slice(0, 140) });
  });
  page.on('response', (r) => {
    if (!clickAt || !keep.test(r.url())) return;
    log.push({ p: 'res', rel: Date.now() - clickAt, s: r.status(), url: r.url().slice(0, 140) });
  });

  console.log('Open', PRODUCT, 'cpu=', CPU_RATE);
  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // Wait Customily / personalization field
  await page.waitForSelector('#customily-cart-btn, input[name^="properties["]', { timeout: 90000 });
  await page.waitForTimeout(8000);

  // Find visible name input
  const fillInfo = await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll('input[type="text"], input:not([type]), textarea')
    ).filter((el) => {
      if (el.disabled) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 20) return false;
      const ctx = `${el.name} ${el.id} ${el.placeholder || ''} ${el.getAttribute('aria-label') || ''}`.toLowerCase();
      if (/search|email|discount|qty|quantity/.test(ctx)) return false;
      return /name|properties\[|enter name|custom/i.test(ctx) || el.name.startsWith('properties[');
    });
    const el = candidates[0];
    if (!el) return { ok: false, count: candidates.length };
    el.removeAttribute('readonly');
    el.disabled = false;
    el.focus();
    el.value = '';
    el.dataset.myprintsyUserEdit = '1';
    return {
      ok: true,
      name: el.name || el.id || el.placeholder || '',
      count: candidates.length,
    };
  });
  console.log('fillInfo', fillInfo);

  if (fillInfo.ok) {
    const locator = page.locator('input[name^="properties["]').first();
    if (await locator.count()) {
      await locator.scrollIntoViewIfNeeded();
      await locator.click({ force: true });
      await locator.fill('');
      await locator.type('ANNA', { delay: 60 });
      await locator.dispatchEvent('input');
      await locator.dispatchEvent('change');
      await locator.blur();
    } else {
      await page.keyboard.type('ANNA', { delay: 60 });
    }
  }

  await page.waitForTimeout(5000);
  const typed = await page.evaluate(() => {
    const el = document.querySelector('input[name^="properties["]');
    return el ? el.value : null;
  });
  console.log('typed =', typed);

  // Ensure Customily ATC visible
  const btn = page.locator('#customily-cart-btn');
  await btn.waitFor({ state: 'visible', timeout: 30000 });
  await btn.scrollIntoViewIfNeeded();

  // Instrument modal detection
  await page.evaluate(() => {
    window.__ATC = { modalAt: 0, marks: [] };
    const mark = (m) => window.__ATC.marks.push({ m, t: Date.now() });
    window.__ATC_MARK = mark;

    const isConfirm = () => {
      const texts = Array.from(document.querySelectorAll('body *'))
        .slice(0, 800)
        .map((el) => (el.childElementCount === 0 ? el.textContent || '' : ''))
        .join(' ');
      if (/Item has been added to your shopping cart/i.test(texts)) return true;
      if (document.querySelector('cart-notification.active')) return true;
      const dlg = document.querySelector('[role="dialog"], .modal, .cart-notification, .ajaxcart');
      if (dlg && /added to your shopping cart|added to cart/i.test(dlg.textContent || '')) return true;
      return false;
    };

    const tick = () => {
      if (!window.__ATC.modalAt && isConfirm()) {
        window.__ATC.modalAt = Date.now();
        mark('confirmModal');
      }
    };
    setInterval(tick, 50);
    new MutationObserver(tick).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    });
  });

  clickAt = Date.now();
  await btn.tap();
  console.log('tapped ATC');

  await page
    .waitForFunction(() => window.__ATC && window.__ATC.modalAt > 0, { timeout: 45000 })
    .catch(() => null);

  const endAt = Date.now();
  await page.waitForTimeout(800);
  await page.screenshot({ path: SHOT, fullPage: false });

  const state = await page.evaluate((clickAtMs) => {
    const modalAt = window.__ATC?.modalAt || 0;
    return {
      typed: document.querySelector('input[name^="properties["]')?.value || null,
      modalRel: modalAt ? modalAt - clickAtMs : null,
      marks: (window.__ATC?.marks || []).map((m) => ({ m: m.m, rel: m.t - clickAtMs })),
      hasConfirmText: /Item has been added to your shopping cart/i.test(document.body.innerText || ''),
      cartCount: document.querySelector('.cart-count-bubble span, .header__icon--cart .count')?.textContent || null,
    };
  }, clickAt);

  // Summarize key network
  const key = log.filter((n) =>
    /preview\/url|amazonaws|cdn\.customily|EPSEngrave|cart\/add|cart\.js/i.test(n.url)
  );
  const firstCustomily = key.find((n) => n.p === 'req' && /customily|amazonaws/i.test(n.url));
  const cartAddReq = key.find((n) => n.p === 'req' && /cart\/add/i.test(n.url));
  const cartAddRes = key.find((n) => n.p === 'res' && /cart\/add/i.test(n.url));

  const out = {
    product: PRODUCT,
    cpuThrottle: CPU_RATE,
    typed,
    clickToModalMs: state.modalRel,
    waitElapsedMs: endAt - clickAt,
    firstCustomilyNetMs: firstCustomily?.rel ?? null,
    cartAddReqMs: cartAddReq?.rel ?? null,
    cartAddResMs: cartAddRes?.rel ?? null,
    state,
    keyNet: key,
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
