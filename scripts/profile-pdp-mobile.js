/**
 * Profile PDP main-thread hogs (timers / rAF / MutationObserver) on mobile emulation,
 * then run ATC and time click -> /cart/add -> cart notification.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';
const CPU_RATE = Number(process.env.ATC_CPU || 4);
const OUT = path.join(__dirname, '..', 'debug-pdp-profile.json');

const INIT = () => {
  window.__PROF = { buckets: {}, moFires: {}, atc: [] };

  const originOf = (stack) => {
    const lines = String(stack || '').split('\n').slice(1, 12);
    for (const line of lines) {
      const m = line.match(/https?:\/\/[^\s)]+/);
      if (!m) continue;
      const url = m[0];
      if (url.includes('/scripts/') && url.includes('profile')) continue;
      return url.split('?')[0].split('/').slice(-1)[0] + (url.includes('cdn.shopify.com') ? '' : ' @' + new URL(url).host);
    }
    return 'unknown';
  };

  const record = (kind, key, ms) => {
    const id = kind + ' | ' + key;
    const b = (window.__PROF.buckets[id] = window.__PROF.buckets[id] || { calls: 0, ms: 0 });
    b.calls += 1;
    b.ms += ms;
  };

  const wrapCb = (kind, key, cb) =>
    function () {
      const s = performance.now();
      try {
        return cb.apply(this, arguments);
      } finally {
        record(kind, key, performance.now() - s);
      }
    };

  const oSetInterval = window.setInterval;
  window.setInterval = function (fn, delay) {
    if (typeof fn !== 'function') return oSetInterval.apply(this, arguments);
    const key = originOf(new Error().stack) + ' every ' + delay + 'ms';
    const args = [wrapCb('interval', key, fn), delay].concat(Array.prototype.slice.call(arguments, 2));
    return oSetInterval.apply(window, args);
  };

  const oRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (fn) {
    if (typeof fn !== 'function') return oRaf(fn);
    const key = originOf(new Error().stack);
    return oRaf(wrapCb('raf', key, fn));
  };

  const OrigMO = window.MutationObserver;
  window.MutationObserver = function (cb) {
    const key = originOf(new Error().stack);
    const wrapped = function (records, obs) {
      const s = performance.now();
      try {
        return cb.call(this, records, obs);
      } finally {
        record('mutationobserver', key, performance.now() - s);
        const f = (window.__PROF.moFires[key] = window.__PROF.moFires[key] || { fires: 0, records: 0 });
        f.fires += 1;
        f.records += records.length;
      }
    };
    const inst = new OrigMO(wrapped);
    return inst;
  };
  window.MutationObserver.prototype = OrigMO.prototype;
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  await context.addInitScript(INIT);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });

  const cartAdd = [];
  page.on('request', (r) => {
    if (/\/cart\/add/.test(r.url())) cartAdd.push({ phase: 'req', at: Date.now() });
  });
  page.on('response', (r) => {
    if (/\/cart\/add/.test(r.url())) cartAdd.push({ phase: 'res', at: Date.now(), status: r.status() });
  });

  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForSelector('input[name^="properties["]', { timeout: 60000 }).catch(() => null);

  const personalizationInput = page.locator('input[name^="properties["]').first();
  if (await personalizationInput.count()) {
    await personalizationInput.scrollIntoViewIfNeeded().catch(() => null);
    await personalizationInput.fill('ANNA').catch(() => null);
    await personalizationInput.dispatchEvent('change').catch(() => null);
  }
  await page.waitForTimeout(20000);

  const idleProfile = await page.evaluate(() => JSON.parse(JSON.stringify(window.__PROF.buckets)));
  const moFires = await page.evaluate(() => JSON.parse(JSON.stringify(window.__PROF.moFires)));

  const btnInfo = await page.evaluate(() => {
    const list = Array.from(
      document.querySelectorAll('#customily-cart-btn, product-form .product-form__submit, button[name="add"]')
    );
    return list.map((b) => ({
      sel: b.id || b.className.slice(0, 80),
      text: (b.textContent || '').trim().slice(0, 40),
      visible: Boolean(b.getClientRects().length),
      disabled: b.disabled,
      ariaDisabled: b.getAttribute('aria-disabled'),
      hiddenAttr: b.getAttribute('data-myprintsy-atc-hidden'),
    }));
  });

  await page.evaluate(() => {
    window.__PROF.buckets = {};
    window.__PROF.moFires = {};
  });

  const clickAt = Date.now();
  await page.evaluate(() => {
    const btn = Array.from(
      document.querySelectorAll('#customily-cart-btn, product-form .product-form__submit, button[name="add"]')
    ).find((b) => b.getClientRects().length && !b.disabled);
    window.__PROF.atc.push({ clicked: btn ? btn.id || btn.className.slice(0, 60) : null, t: Date.now() });
    if (btn) btn.click();
  });

  await page
    .waitForFunction(() => document.querySelector('cart-notification.active'), { timeout: 45000 })
    .catch(() => null);
  const notifAt = Date.now();
  await page.waitForTimeout(1000);

  const atcProfile = await page.evaluate(() => ({
    buckets: JSON.parse(JSON.stringify(window.__PROF.buckets)),
    moFires: JSON.parse(JSON.stringify(window.__PROF.moFires)),
    atc: window.__PROF.atc,
    notifActive: Boolean(document.querySelector('cart-notification.active')),
    err: document.querySelector('.product-form__error-message')?.textContent?.trim() || null,
  }));

  const top = (obj, n = 15) =>
    Object.entries(obj)
      .map(([k, v]) => ({ k, calls: v.calls, ms: Math.round(v.ms) }))
      .sort((a, b) => b.ms - a.ms)
      .slice(0, n);

  const result = {
    product: PRODUCT,
    cpuThrottle: CPU_RATE,
    btnInfo,
    idleTop: top(idleProfile),
    idleMoFires: Object.entries(moFires)
      .map(([k, v]) => ({ k, ...v }))
      .sort((a, b) => b.fires - a.fires)
      .slice(0, 10),
    atcTop: top(atcProfile.buckets),
    atcMoFires: Object.entries(atcProfile.moFires)
      .map(([k, v]) => ({ k, ...v }))
      .sort((a, b) => b.fires - a.fires)
      .slice(0, 10),
    clicked: atcProfile.atc,
    notifActive: atcProfile.notifActive,
    formError: atcProfile.err,
    cartAddRel: cartAdd.map((c) => ({ ...c, rel: c.at - clickAt })),
    clickToNotificationMs: atcProfile.notifActive ? notifAt - clickAt : null,
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ ...result, idleMoFires: result.idleMoFires.slice(0, 6) }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
