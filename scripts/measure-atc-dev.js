/**
 * Measure ATC → /cart latency on DEV theme (Playwright ≈ DevTools Network).
 * Clicks Customily ATC (#customily-cart-btn), gift box UNCHECKED.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const THEME_ID = '186878558524';
const PRODUCT =
  'https://myprintsy-3.myshopify.com/products/make-it-happen-personalized-tumbler-cup-scthth1l14?preview_theme_id=' +
  THEME_ID;
const OUT = path.join(__dirname, '..', 'debug-5cd159-playwright.json');
const LOG = path.join(__dirname, '..', 'debug-5cd159.log');

function appendLog(entry) {
  fs.appendFileSync(
    LOG,
    JSON.stringify({
      sessionId: '5cd159',
      runId: 'playwright-auto',
      timestamp: Date.now(),
      ...entry,
    }) + '\n'
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 420, height: 900 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();

  const net = [];
  const markNet = (type, reqOrRes) => {
    const url = reqOrRes.url();
    if (!/cart\/add|cart\.js|cart\/update|\/cart(\?|$|\/)|customily/i.test(url)) return;
    const row = { type, url: url.slice(0, 180), at: Date.now() };
    if (type === 'res') {
      row.status = reqOrRes.status();
      try {
        row.timing = reqOrRes.request().timing();
      } catch (_) {}
    } else {
      row.method = reqOrRes.method();
    }
    net.push(row);
  };
  page.on('request', (req) => markNet('req', req));
  page.on('response', (res) => markNet('res', res));

  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('[ATC-DBG]')) {
      appendLog({ location: 'console', message: text, hypothesisId: 'PLAY' });
    }
  });

  console.log('Opening product (DEV preview)...');
  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#customily-cart-btn', { timeout: 60000 });
  await page.waitForTimeout(2500);

  // Uncheck gift box (defaults to checked on this PDP)
  const giftInfo = await page.evaluate(() => {
    const box = document.querySelector('.addon-gift-box input[type="checkbox"]');
    if (box) {
      if (box.checked) {
        box.checked = false;
        box.dispatchEvent(new Event('change', { bubbles: true }));
        box.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    return {
      found: Boolean(box),
      checkedAfter: box ? box.checked : null,
      defaultWasPossiblyChecked: true,
    };
  });
  appendLog({
    hypothesisId: 'A',
    location: 'measure-atc-dev.js:gift',
    message: 'Gift checkbox forced unchecked',
    data: giftInfo,
  });

  // Fill Customily personalization if present
  await page.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll('input, textarea')).filter((el) => {
      if (el.type === 'hidden' || el.type === 'checkbox' || el.disabled) return false;
      if (!el.offsetParent && el.getClientRects().length === 0) return false;
      const label = (
        (el.getAttribute('placeholder') || '') +
        (el.getAttribute('aria-label') || '') +
        (el.name || '') +
        (el.id || '')
      ).toLowerCase();
      return label.includes('name') || label.includes('enter') || label.includes('tumbler');
    });
    const el = candidates[0];
    if (el) {
      el.focus();
      el.value = 'Test';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return { filled: Boolean(el), count: candidates.length };
  });

  // Instrument fetch + location in page
  await page.evaluate(() => {
    window.__ATC_TIMINGS__ = { marks: [], clickAt: 0 };
    const mark = (m, data) => {
      const row = { m, t: Date.now(), data: data || {} };
      window.__ATC_TIMINGS__.marks.push(row);
      console.log('[ATC-DBG]', JSON.stringify(row));
    };
    window.__ATC_MARK__ = mark;

    const btn = document.getElementById('customily-cart-btn');
    if (btn) {
      btn.addEventListener(
        'click',
        () => {
          window.__ATC_TIMINGS__.clickAt = Date.now();
          mark('click');
        },
        true
      );
    }

    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input && input.url;
      const u = String(url || '');
      if (u.includes('/cart/add') || u.includes('cart/add')) {
        const start = Date.now();
        mark('cartAddStart', {
          url: u.slice(0, 120),
          sinceClick: window.__ATC_TIMINGS__.clickAt
            ? start - window.__ATC_TIMINGS__.clickAt
            : null,
        });
        return origFetch(input, init).then((res) => {
          mark('cartAddEnd', {
            ms: Date.now() - start,
            status: res.status,
            sinceClick: window.__ATC_TIMINGS__.clickAt
              ? Date.now() - window.__ATC_TIMINGS__.clickAt
              : null,
          });
          return res;
        });
      }
      return origFetch(input, init);
    };

    // XHR fallback (Customily may use XHR)
    const OrigXHR = window.XMLHttpRequest;
    function WrappedXHR() {
      const xhr = new OrigXHR();
      const open = xhr.open;
      xhr.open = function (method, url) {
        this.__dbgUrl = String(url || '');
        return open.apply(this, arguments);
      };
      xhr.addEventListener('loadstart', function () {
        if (this.__dbgUrl && this.__dbgUrl.includes('/cart/add')) {
          this.__dbgStart = Date.now();
          mark('cartAddXhrStart', {
            url: this.__dbgUrl.slice(0, 120),
            sinceClick: window.__ATC_TIMINGS__.clickAt
              ? Date.now() - window.__ATC_TIMINGS__.clickAt
              : null,
          });
        }
      });
      xhr.addEventListener('loadend', function () {
        if (this.__dbgUrl && this.__dbgUrl.includes('/cart/add')) {
          mark('cartAddXhrEnd', {
            ms: this.__dbgStart ? Date.now() - this.__dbgStart : null,
            status: this.status,
            sinceClick: window.__ATC_TIMINGS__.clickAt
              ? Date.now() - window.__ATC_TIMINGS__.clickAt
              : null,
          });
        }
      });
      return xhr;
    }
    window.XMLHttpRequest = WrappedXHR;
  });

  const atc = page.locator('#customily-cart-btn');
  await atc.waitFor({ state: 'visible', timeout: 30000 });

  const clickAt = Date.now();
  appendLog({
    hypothesisId: 'E',
    location: 'measure-atc-dev.js:click',
    message: 'Clicking Customily ATC',
    data: { clickAt, giftChecked: giftInfo.checkedAfter },
  });

  await Promise.all([
    page.waitForURL(/\/cart/, { timeout: 90000 }).catch(() => null),
    atc.click({ timeout: 15000 }),
  ]);

  const cartUrlAt = Date.now();
  const landedCart = /\/cart/.test(page.url());

  let cartReadyAt = null;
  if (landedCart) {
    try {
      await page.waitForSelector('cart-items, .cart-items, #main-cart-items, form[action="/cart"]', {
        timeout: 45000,
      });
      cartReadyAt = Date.now();
    } catch (_) {
      cartReadyAt = Date.now();
    }
  } else {
    // Still on PDP — capture error / spinner state
    await page.waitForTimeout(2000);
  }

  const pageState = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const gift = document.querySelector('.addon-gift-box input[type="checkbox"]');
    const err =
      document.querySelector('.product-form__error-message')?.textContent ||
      document.querySelector('[class*="error"]')?.textContent ||
      null;
    return {
      url: location.href,
      giftCheckedNow: gift ? gift.checked : null,
      errorText: err ? String(err).slice(0, 200) : null,
      marks: window.__ATC_TIMINGS__ || null,
      nav: nav
        ? {
            duration: Math.round(nav.duration),
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            loadEventEnd: Math.round(nav.loadEventEnd),
            responseStart: Math.round(nav.responseStart),
          }
        : null,
    };
  });

  // Derive phases from marks
  const marks = (pageState.marks && pageState.marks.marks) || [];
  const by = (m) => marks.filter((x) => x.m === m);
  const clickMark = by('click')[0];
  const addStart = by('cartAddStart')[0] || by('cartAddXhrStart')[0];
  const addEnd = by('cartAddEnd')[0] || by('cartAddXhrEnd')[0];

  const phases = {
    clickToCartAddStartMs:
      clickMark && addStart ? addStart.t - clickMark.t : addStart?.data?.sinceClick ?? null,
    cartAddMs: addEnd?.data?.ms ?? (addStart && addEnd ? addEnd.t - addStart.t : null),
    clickToCartUrlMs: landedCart ? cartUrlAt - clickAt : null,
    cartPageReadyMs: cartReadyAt && cartUrlAt ? cartReadyAt - cartUrlAt : null,
    totalClickToReadyMs: cartReadyAt ? cartReadyAt - clickAt : null,
  };

  const result = {
    giftInfo,
    phases,
    landedCart,
    finalUrl: page.url(),
    pageState,
    netSummary: net.map((n) => ({
      type: n.type,
      status: n.status,
      at: n.at,
      url: n.url,
      responseEnd: n.timing && n.timing.responseEnd,
    })),
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  appendLog({
    hypothesisId: 'SUMMARY',
    location: 'measure-atc-dev.js:done',
    message: 'ATC measurement complete',
    data: {
      phases,
      giftChecked: giftInfo.checkedAfter,
      landedCart,
      marks,
      cartAddNet: net.filter((n) => /cart\/add/.test(n.url)),
    },
  });

  console.log(JSON.stringify(result, null, 2));
  await browser.close();
})().catch((err) => {
  console.error(err);
  appendLog({
    hypothesisId: 'ERR',
    location: 'measure-atc-dev.js:error',
    message: String(err && err.message ? err.message : err),
  });
  process.exit(1);
});
