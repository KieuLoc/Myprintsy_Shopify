/**
 * Measure ATC spinner duration on LIVE (mobile emulation + CPU throttle).
 * Timeline: click -> requests -> /cart/add -> cart-notification visible.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';
const CPU_RATE = Number(process.env.ATC_CPU || 4);
const OUT = path.join(__dirname, '..', 'debug-atc-live-mobile.json');

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
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_RATE });

  const net = [];
  page.on('request', (req) => net.push({ phase: 'req', at: Date.now(), method: req.method(), url: req.url() }));
  page.on('response', (res) => net.push({ phase: 'res', at: Date.now(), status: res.status(), url: res.url() }));

  console.log('Opening', PRODUCT);
  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });

  await page
    .waitForSelector('product-form .product-form__submit, #customily-cart-btn', { timeout: 60000 })
    .catch(() => null);
  await page.waitForTimeout(6000);

  const filled = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea')).filter((el) => {
      if (el.disabled || el.readOnly) return false;
      if (!el.getClientRects().length) return false;
      const ctx = (el.name + ' ' + el.id + ' ' + (el.placeholder || '') + ' ' + el.className).toLowerCase();
      if (ctx.includes('search') || ctx.includes('email') || ctx.includes('discount')) return false;
      return true;
    });
    inputs.slice(0, 3).forEach((el) => {
      el.focus();
      el.value = 'Anna';
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.blur();
    });
    return inputs.slice(0, 3).map((el) => el.name || el.id || el.className);
  });
  console.log('Filled personalization inputs:', filled);

  await page.waitForTimeout(6000);

  await page.evaluate(() => {
    window.__T = { marks: [], longTasks: [] };
    const mark = (m, data) => window.__T.marks.push({ m, t: Date.now(), data: data || {} });
    window.__MARK = mark;

    try {
      new PerformanceObserver((list) => {
        list.getEntries().forEach((e) => {
          if (e.duration >= 50) window.__T.longTasks.push({ at: Date.now(), dur: Math.round(e.duration) });
        });
      }).observe({ entryTypes: ['longtask'] });
    } catch (_) {}

    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const u = String(typeof input === 'string' ? input : (input && input.url) || '');
      const start = Date.now();
      mark('fetchStart', { u: u.slice(0, 140) });
      return origFetch(input, init).then((res) => {
        mark('fetchEnd', { u: u.slice(0, 140), ms: Date.now() - start, status: res.status });
        return res;
      });
    };

    const OrigXHR = window.XMLHttpRequest;
    window.XMLHttpRequest = function () {
      const xhr = new OrigXHR();
      const open = xhr.open;
      xhr.open = function (method, url) {
        this.__u = String(url || '');
        return open.apply(this, arguments);
      };
      xhr.addEventListener('loadstart', function () {
        this.__s = Date.now();
        mark('xhrStart', { u: this.__u.slice(0, 140) });
      });
      xhr.addEventListener('loadend', function () {
        mark('xhrEnd', { u: this.__u.slice(0, 140), ms: Date.now() - this.__s, status: this.status });
      });
      return xhr;
    };

    const btn =
      document.querySelector('#customily-cart-btn') ||
      document.querySelector('product-form .product-form__submit');
    if (btn) btn.addEventListener('click', () => mark('click'), true);

    const notif = document.querySelector('cart-notification');
    if (notif) {
      new MutationObserver(() => {
        if (notif.classList.contains('active')) mark('notificationOpen');
      }).observe(notif, { attributes: true, attributeFilter: ['class'] });
    }

    const submit = document.querySelector('product-form .product-form__submit');
    if (submit) {
      new MutationObserver(() => {
        mark(submit.classList.contains('loading') ? 'spinnerOn' : 'spinnerOff');
      }).observe(submit, { attributes: true, attributeFilter: ['class'] });
    }
  });

  const clickAt = Date.now();
  await page.evaluate(() => {
    const btn =
      document.querySelector('#customily-cart-btn') ||
      document.querySelector('product-form .product-form__submit');
    btn && btn.click();
  });

  await page
    .waitForFunction(() => document.querySelector('cart-notification.active'), { timeout: 60000 })
    .catch(() => null);
  const notifAt = Date.now();
  await page.waitForTimeout(1500);

  const state = await page.evaluate(() => window.__T);

  const rel = (t) => t - clickAt;
  const marks = (state.marks || []).map((m) => ({ ...m, rel: rel(m.t) }));
  const netAfterClick = net
    .filter((n) => n.at >= clickAt - 500)
    .map((n) => ({ ...n, rel: rel(n.at), url: n.url.slice(0, 150) }));

  const result = {
    product: PRODUCT,
    cpuThrottle: CPU_RATE,
    filled,
    clickToNotificationMs: notifAt - clickAt,
    marks,
    longTasksAfterClick: (state.longTasks || []).filter((l) => l.at >= clickAt).map((l) => ({ rel: rel(l.at), dur: l.dur })),
    netAfterClick,
  };

  fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log('clickToNotificationMs =', result.clickToNotificationMs);
  console.log(
    JSON.stringify(
      marks.filter((m) => !/fetchStart|fetchEnd|xhrStart|xhrEnd/.test(m.m) || /cart|customily|klaviyo/i.test(m.data.u || '')),
      null,
      2
    )
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
