/**
 * PDP ETA: if the SetuBridge app hasn't drawn .sb_ETA after ~8s, the theme shows a fallback
 * "Get Estimated delivery: <today+7> - <today+13>"; once the app draws, its box replaces the fallback.
 *   THEME=186878558524 node scripts/check-eta-fallback.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = process.env.THEME || '186878558524';
const BMSM = 'custom-name-ornament-for-kids-family-personalized-christmas-ornament-xmthth2o18';
const NO_BMSM = 'who-makes-the-rules-personalized-tumbler-cup-kdthah1o19';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const n = d.getDate();
  const suf = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th';
  return `${MONTHS[d.getMonth()]} ${n}${suf}`;
}
const EXPECTED = `Get Estimated delivery: ${fmt(7)} - ${fmt(13)}`;

function state() {
  const info = document.querySelector('.product__info-container');
  const fb = info.querySelector('.myprintsy-eta-fallback');
  const eta = info.querySelector('.sb_ETA');
  const slot = fb && fb.previousElementSibling;
  return {
    fallback: fb ? fb.innerText.replace(/\s+/g, ' ').trim() : null,
    fallbackH: fb ? Math.round(fb.getBoundingClientRect().height) : 0,
    fallbackAfterBmsm: !!(slot && slot.previousElementSibling && slot.previousElementSibling.classList.contains('bmsm')),
    app: !!eta && eta.getBoundingClientRect().height > 10 && /deliver/i.test(eta.innerText),
  };
}

async function open(browser, handle, appMode) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, userAgent: UA });
  await page.route('**/ip-blocker-embed*', (r) => r.abort());
  if (appMode === 'fail') await page.route('**/edd_jquery.min.js', (r) => r.abort());
  if (appMode === 'slow') {
    await page.route('**/edd_jquery.min.js', async (r) => {
      await new Promise((s) => setTimeout(s, 12000));
      r.continue().catch(() => {});
    });
  }
  const t0 = Date.now();
  await page.goto(`https://myprintsy-3.myshopify.com/products/${handle}?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { page, t0 };
}

async function waitFor(page, fn, timeout) {
  try {
    await page.waitForFunction(fn, null, { timeout, polling: 100 });
    return true;
  } catch (e) {
    return false;
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // App works: only the app box, no fallback left behind.
  {
    const { page } = await open(browser, BMSM, 'ok');
    await page.waitForTimeout(11000);
    const s = await page.evaluate(state);
    assert.ok(s.app, 'app chạy bình thường mà không thấy ETA của app');
    assert.equal(s.fallback, null, `app đã vẽ mà vẫn còn ô dự phòng: "${s.fallback}"`);
    console.log('PASS app OK: ETA của app hiện, không có ô dự phòng sau 11s');
    await page.close();
  }

  // App fails to load: fallback shows ~8s with today+7..+13, in the slot under Buy More box.
  for (const handle of [BMSM, NO_BMSM]) {
    const { page, t0 } = await open(browser, handle, 'fail');
    const early = await page.evaluate(() => !!document.querySelector('.myprintsy-eta-fallback') && performance.now() < 7500);
    const shown = await waitFor(page, () => document.querySelector('.myprintsy-eta-fallback'), 15000);
    const at = Date.now() - t0;
    const s = await page.evaluate(state);
    assert.ok(!early, 'ô dự phòng hiện trước 7.5s kể từ lúc mở trang');
    assert.ok(shown, 'app lỗi 15s mà không có ô dự phòng');
    assert.ok(at >= 7500 && at <= 11000, `ô dự phòng hiện lúc ${at}ms (mong ~8000ms)`);
    assert.equal(s.fallback, EXPECTED, `nội dung "${s.fallback}" khác "${EXPECTED}"`);
    assert.ok(s.fallbackH > 20, `ô dự phòng cao ${s.fallbackH}px`);
    if (handle === BMSM) assert.ok(s.fallbackAfterBmsm, 'ô dự phòng không nằm ngay dưới hộp Buy More');
    console.log(`PASS app lỗi (${handle.slice(0, 30)}): dự phòng hiện lúc ${at}ms, cao ${s.fallbackH}px, "${s.fallback}"`);
    await page.close();
  }

  // App draws late (after the fallback): its box takes the slot, fallback goes away.
  // A delayed edd_jquery doesn't do it — the app never recovers from that on its own — so draw .sb_ETA the way the app does.
  {
    const { page, t0 } = await open(browser, BMSM, 'fail');
    const shown = await waitFor(page, () => document.querySelector('.myprintsy-eta-fallback'), 11000);
    const shownAt = Date.now() - t0;
    assert.ok(shown, 'app chậm: không thấy ô dự phòng trước khi app vẽ');
    await page.evaluate(() => {
      const eta = document.createElement('div');
      eta.className = 'sb_ETA';
      eta.innerHTML = '<div class="sb_delivery"><div class="delivery_msg">Delivered to United States<br>Get Estimated delivery Nov 6th - Nov 12th</div></div>';
      document.querySelector('.custom_delivery_estimation_widget:not([data-myprintsy-edd-slot])')?.appendChild(eta) || document.body.appendChild(eta);
    });
    const replaced = await waitFor(
      page,
      () => {
        const e = document.querySelector('.sb_ETA');
        return e && e.getBoundingClientRect().height > 10 && !document.querySelector('.myprintsy-eta-fallback');
      },
      20000
    );
    const replacedAt = Date.now() - t0;
    const s = await page.evaluate(state);
    assert.ok(replaced, `app chậm: sau 20s vẫn chưa thay (fallback="${s.fallback}", app=${s.app})`);
    console.log(`PASS app chậm: dự phòng lúc ${shownAt}ms, app thay chỗ lúc ${replacedAt}ms`);
    await page.close();
  }

  await browser.close();
  console.log('ALL PASS');
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
