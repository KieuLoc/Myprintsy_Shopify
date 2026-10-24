/**
 * Check: đổi Size trên PDP không làm nút Add to cart biến mất / dựng lại.
 * A) Bedding — prefetch xong rồi bấm size còn hàng: cùng 1 nút, không request section, < 800ms.
 *    Nếu có size sold out: nút đổi chữ Sold out nhưng vẫn hiện, rồi bấm lại size còn hàng.
 * B) Bedding bấm TRƯỚC khi prefetch xong (cache miss): nút phải trở lại chữ thật, không kẹt disabled.
 * C) Legging (nhiều size) và Mug Pack: sau khi đổi option, vẫn còn nút ATC nhìn thấy được.
 * Shopify /cart/add.js từ Playwright không giữ giỏ — check này không bấm ATC, không đếm item.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const BEDDING = 'regal-white-christmas-3-piece-quilted-bedding-set-ncu0nt11351';
const LEGGING = 'ghost-oath-leggings';
const MUG = 'pickleball-lover-personalized-mug-pklaah2a03';

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

function productUrl(handle) {
  return `${BASE}/products/${handle}?preview_theme_id=${THEME}`;
}

async function openPage(browser, handle) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const sectionReqs = [];
  const pageErrors = [];
  page.on('request', (req) => {
    if (req.url().includes('option_values=')) sectionReqs.push(req.url());
  });
  page.on('pageerror', (err) => pageErrors.push((err.stack || String(err)).slice(0, 400)));
  await page.addInitScript(HIDE_OVERLAY);
  await page.goto(productUrl(handle), { waitUntil: 'domcontentloaded', timeout: 60000 });
  return { page, sectionReqs, pageErrors };
}

async function waitPrefetch(page) {
  await page.waitForFunction(
    () => {
      const s = window.__myprintsySizePrefetch;
      return s && typeof s.queued === 'number' && s.done >= s.queued;
    },
    { timeout: 45000 }
  );
  return page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const sections = performance.getEntriesByType('resource').filter((r) => r.name.includes('option_values='));
    return {
      prefetch: window.__myprintsySizePrefetch,
      loadEventEnd: nav ? Math.round(nav.loadEventEnd) : 0,
      firstSection: sections.length ? Math.round(Math.min(...sections.map((r) => r.startTime))) : null,
      sectionCount: sections.length,
    };
  });
}

async function pickSize(page, unavailable) {
  return page.evaluate((wantUnavailable) => {
    const fs = Array.from(document.querySelectorAll('variant-selects fieldset')).find((el) => {
      const legend = (el.querySelector('legend')?.textContent || '').toLowerCase();
      return legend.includes('size') && !legend.includes('pack') && !legend.includes('buy more');
    });
    if (!fs) return { ok: false, reason: 'không thấy fieldset Size' };
    const radios = Array.from(fs.querySelectorAll('input[type="radio"]'));
    const pick = radios.find((r) => {
      if (r.checked) return false;
      const sold = r.classList.contains('disabled');
      return wantUnavailable ? sold : !sold;
    });
    if (!pick) return { ok: false, reason: wantUnavailable ? 'không có size sold out' : 'không có size khác còn hàng' };
    const label = document.querySelector(`label[for="${CSS.escape(pick.id)}"]`);
    return {
      ok: true,
      id: pick.id,
      value: (label ? label.innerText : pick.value).replace(/\s+/g, ' ').trim().slice(0, 40),
      sold: pick.classList.contains('disabled'),
    };
  }, unavailable);
}

async function markButton(page) {
  return page.evaluate(() => {
    const btn = document.querySelector('product-info product-form button[name="add"]');
    const idInput = document.querySelector('product-info product-form input[name="id"]');
    if (!btn || !idInput) return { ok: false };
    btn.dataset.myprintsyMark = 'stay';
    window.__atcTrace = [];
    const sample = () => {
      const b = document.querySelector('product-info product-form button[data-myprintsy-mark="stay"]');
      const cs = b ? getComputedStyle(b) : null;
      const r = b ? b.getBoundingClientRect() : null;
      window.__atcTrace.push({
        found: !!b,
        display: cs ? cs.display : '',
        vis: cs ? cs.visibility : '',
        h: r ? Math.round(r.height) : 0,
        text: b ? (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '',
        disabled: b ? !!b.disabled : null,
        hidden: b ? b.getAttribute('data-myprintsy-atc-hidden') : null,
      });
    };
    sample();
    clearInterval(window.__atcTimer);
    window.__atcTimer = setInterval(sample, 40);
    return {
      ok: true,
      variantId: idInput.value,
      text: (btn.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      disabled: !!btn.disabled,
    };
  });
}

async function stopTrace(page) {
  return page.evaluate(() => {
    clearInterval(window.__atcTimer);
    const idInput = document.querySelector('product-info product-form input[name="id"]');
    const btn = document.querySelector('product-info product-form button[data-myprintsy-mark="stay"]');
    const price = document.querySelector('product-info .price');
    return {
      trace: window.__atcTrace || [],
      variantId: idInput ? idInput.value : '',
      text: btn ? (btn.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '',
      disabled: btn ? !!btn.disabled : null,
      price: price ? (price.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '',
    };
  });
}

function assertNoOurErrors(pageErrors, label) {
  const ours = pageErrors.filter((stack) => /product-info\.js|customily-preview-atc\.js/.test(stack));
  assert.ok(ours.length === 0, `lỗi JS ${label}: ${ours.join(' | ')}`);
  if (pageErrors.length) console.log(`WARN ${label} lỗi script khác (${pageErrors.length}): ${pageErrors[0].split('\n')[0]}`);
}

function atcLetters(text) {
  const match = String(text || '').match(/add to cart/i);
  return match ? match[0] : '';
}

function assertTraceStable(trace, label) {
  assert.ok(trace.length > 2, `${label}: chỉ lấy được ${trace.length} mẫu nút`);
  const bad = trace.find((s) => !s.found || s.display === 'none' || s.vis === 'hidden' || s.h < 8 || !s.text || s.hidden === '1');
  assert.ok(
    !bad,
    `${label}: nút gãy ${JSON.stringify(bad)} (${trace.length} mẫu)`
  );
}

async function clickSizeAndMeasure(page, sectionReqs, target) {
  const before = await markButton(page);
  assert.ok(before.ok, 'không thấy nút Add to cart của theme');
  const reqBefore = sectionReqs.length;
  const t0 = Date.now();
  await page.locator('label[for="' + target.id + '"]').click();
  await page.waitForFunction(
    (prev) => {
      const input = document.querySelector('product-info product-form input[name="id"]');
      return input && input.value !== prev;
    },
    before.variantId,
    { timeout: 8000 }
  );
  const elapsed = Date.now() - t0;
  await page.waitForTimeout(1200);
  const after = await stopTrace(page);
  return { before, after, elapsed, sectionDuring: sectionReqs.length - reqBefore };
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const fail = (e) => {
    failed += 1;
    console.log('FAIL ' + e.message);
  };

  try {
    const { page, sectionReqs, pageErrors } = await openPage(browser, BEDDING);
    const pre = await waitPrefetch(page);
    console.log(
      `bedding prefetch queued=${pre.prefetch.queued} done=${pre.prefetch.done} sectionReqs=${pre.sectionCount} firstSection=${pre.firstSection}ms loadEnd=${pre.loadEventEnd}ms`
    );
    assert.ok(pre.prefetch.queued >= 1 && pre.prefetch.queued <= 12, `queued=${pre.prefetch.queued}`);
    assert.ok(pre.prefetch.done === pre.prefetch.queued, `done=${pre.prefetch.done} queued=${pre.prefetch.queued}`);
    assert.ok(
      pre.firstSection == null || pre.firstSection >= pre.loadEventEnd,
      `prefetch chạy lúc ${pre.firstSection}ms, trang load xong lúc ${pre.loadEventEnd}ms`
    );

    const next = await pickSize(page, false);
    assert.ok(next.ok, next.reason);
    const warm = await clickSizeAndMeasure(page, sectionReqs, next);
    assertTraceStable(warm.after.trace, `bedding → ${next.value}`);
    assert.ok(
      warm.elapsed < 800,
      `bedding đổi size mất ${warm.elapsed}ms (kỳ vọng < 800 vì đã prefetch)`
    );
    assert.ok(warm.sectionDuring === 0, `bedding vẫn tải section lúc bấm: ${warm.sectionDuring} request`);
    assert.ok(warm.after.variantId !== warm.before.variantId, 'variant id không đổi');
    assert.ok(/add to cart/i.test(warm.after.text), `chữ nút "${warm.after.text}"`);
    assert.strictEqual(
      atcLetters(warm.after.text),
      atcLetters(warm.before.text),
      `chữ nút "${warm.before.text}" thành "${warm.after.text}"`
    );
    const cases = [...new Set(warm.after.trace.map((sample) => atcLetters(sample.text)).filter(Boolean))];
    assert.deepStrictEqual(cases, [atcLetters(warm.before.text)], `chữ nút nhảy ${cases.join(' → ')}`);
    assert.ok(warm.after.disabled === false, `nút bị disabled dù size còn hàng, chữ "${warm.after.text}"`);
    assert.ok(warm.after.price.length > 0, 'khối giá bị trống');
    console.log(
      `PASS bedding warm ${next.value}: ${warm.elapsed}ms, section=${warm.sectionDuring}, nút "${warm.after.text}", ${warm.after.trace.length} mẫu, giá "${warm.after.price}"`
    );

    const back = await pickSize(page, false);
    if (back.ok) {
      const backHit = await clickSizeAndMeasure(page, sectionReqs, back);
      assertTraceStable(backHit.after.trace, `bedding quay lại ${back.value}`);
      assert.ok(backHit.elapsed < 800, `quay lại size mất ${backHit.elapsed}ms`);
      assert.ok(backHit.sectionDuring === 0, `quay lại vẫn tải section: ${backHit.sectionDuring}`);
      assert.ok(/add to cart/i.test(backHit.after.text) && backHit.after.disabled === false, `quay lại chữ "${backHit.after.text}" disabled=${backHit.after.disabled}`);
      assert.strictEqual(
        atcLetters(backHit.after.text),
        atcLetters(backHit.before.text),
        `quay lại chữ "${backHit.before.text}" thành "${backHit.after.text}"`
      );
      console.log(`PASS bedding quay lại ${back.value}: ${backHit.elapsed}ms, section=${backHit.sectionDuring}`);
    }

    const sold = await pickSize(page, true);
    if (!sold.ok) {
      console.log('SKIP bedding sold-out: ' + sold.reason);
    } else {
      const soldHit = await clickSizeAndMeasure(page, sectionReqs, sold);
      assertTraceStable(soldHit.after.trace, `bedding sold ${sold.value}`);
      assert.ok(/sold out|unavailable/i.test(soldHit.after.text), `size hết hàng nhưng nút là "${soldHit.after.text}"`);
      await page.waitForTimeout(1500);
      const still = await page.evaluate(() => {
        const b = document.querySelector('product-info product-form button[data-myprintsy-mark="stay"]');
        return b ? (b.innerText || '').replace(/\s+/g, ' ').trim() : '';
      });
      assert.ok(/sold out|unavailable/i.test(still), `1.5s sau chữ nút bị đổi thành "${still}"`);
      console.log(`PASS bedding sold-out ${sold.value}: ${soldHit.elapsed}ms, nút "${still}"`);

      const backIn = await pickSize(page, false);
      assert.ok(backIn.ok, backIn.reason);
      const restored = await clickSizeAndMeasure(page, sectionReqs, backIn);
      assertTraceStable(restored.after.trace, `bedding hết hàng → còn hàng ${backIn.value}`);
      assert.ok(/add to cart/i.test(restored.after.text) && restored.after.disabled === false, `trở lại chữ "${restored.after.text}" disabled=${restored.after.disabled}`);
      console.log(`PASS bedding sold → in stock ${backIn.value}: ${restored.elapsed}ms, nút "${restored.after.text}"`);
    }

    assertNoOurErrors(pageErrors, 'bedding');
    await page.close();
  } catch (e) {
    fail(e);
  }

  try {
    const { page, sectionReqs, pageErrors } = await openPage(browser, BEDDING);
    let releaseGate;
    const gate = new Promise((resolve) => {
      releaseGate = resolve;
    });
    await page.route(/option_values=/, async (route) => {
      await gate;
      await route.continue();
    });
    await page.waitForSelector('variant-selects fieldset input[type="radio"]', { timeout: 20000 });
    const early = await pickSize(page, false);
    assert.ok(early.ok, early.reason);
    const beforeId = await page.evaluate(() => document.querySelector('product-info product-form input[name="id"]')?.value || '');
    const reqBefore = sectionReqs.length;
    const t0 = Date.now();
    await page.locator('label[for="' + early.id + '"]').click();
    releaseGate();
    await page.waitForFunction(
      (prev) => {
        const input = document.querySelector('product-info product-form input[name="id"]');
        return input && input.value && input.value !== prev;
      },
      beforeId,
      { timeout: 8000 }
    );
    const elapsed = Date.now() - t0;
    await page.waitForTimeout(1200);
    const end = await page.evaluate(() => {
      const b = document.querySelector('product-info product-form button[name="add"]');
      const cs = b ? getComputedStyle(b) : null;
      const r = b ? b.getBoundingClientRect() : null;
      return {
        text: b ? (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60) : '',
        disabled: b ? !!b.disabled : null,
        h: r ? Math.round(r.height) : 0,
        display: cs ? cs.display : '',
        variantId: document.querySelector('product-info product-form input[name="id"]')?.value || '',
      };
    });
    assert.ok(end.variantId !== beforeId, 'cache miss: variant id không đổi');
    assert.ok(end.h >= 8 && end.display !== 'none', `cache miss: nút cao ${end.h}px display=${end.display}`);
    assert.ok(/add to cart|sold out|unavailable/i.test(end.text), `cache miss: chữ "${end.text}"`);
    if (/add to cart/i.test(end.text)) assert.ok(end.disabled === false, `cache miss: còn hàng nhưng disabled, chữ "${end.text}"`);
    if (/sold out|unavailable/i.test(end.text)) assert.ok(end.disabled === true, `cache miss: hết hàng nhưng nút vẫn bấm được, chữ "${end.text}"`);
    assert.ok(sectionReqs.length - reqBefore >= 1, 'cache miss không thấy request section — prefetch đã kịp, case này không còn là miss');
    assertNoOurErrors(pageErrors, 'cache miss');
    console.log(`PASS bedding cache miss ${early.value}: ${elapsed}ms, section=${sectionReqs.length - reqBefore}, nút "${end.text}" disabled=${end.disabled}`);
    await page.close();
  } catch (e) {
    fail(e);
  }

  try {
    const { page, pageErrors } = await openPage(browser, LEGGING);
    const pre = await waitPrefetch(page);
    assert.ok(pre.prefetch.queued >= 1, `legging queued=${pre.prefetch.queued}`);
    assert.ok(pre.prefetch.done === pre.prefetch.queued, `legging done=${pre.prefetch.done}/${pre.prefetch.queued}`);
    const customily = await page.evaluate(
      () => !!document.querySelector('#customily-cart-btn, #customily-options, [class*="customily"]')
    );
    const next = await pickSize(page, false);
    assert.ok(next.ok, 'legging: ' + next.reason);
    if (!customily) {
      const hit = await clickSizeAndMeasure(page, { length: 0, push() {} }, next);
      // section count not tracked on this stand-in; re-read from a real listener below if needed
      assertTraceStable(hit.after.trace, `legging ${next.value}`);
      assert.ok(hit.after.variantId !== hit.before.variantId, 'legging variant id không đổi');
      assert.ok(/add to cart/i.test(hit.after.text), `legging chữ "${hit.after.text}"`);
      assert.strictEqual(
        atcLetters(hit.after.text),
        atcLetters(hit.before.text),
        `legging chữ "${hit.before.text}" thành "${hit.after.text}"`
      );
      if (!hit.before.disabled) {
        assert.ok(
          hit.after.disabled === false,
          `legging nút bị khóa sau đổi size, trước đó đang bấm được. chữ "${hit.after.text}"`
        );
      }
      console.log(
        `PASS legging (không Customily) ${next.value}: ${hit.elapsed}ms, nút "${hit.after.text}", disabled ${hit.before.disabled} → ${hit.after.disabled}`
      );
    } else {
      const beforeId = await page.evaluate(() => document.querySelector('product-info product-form input[name="id"]')?.value || '');
      const t0 = Date.now();
      await page.locator('label[for="' + next.id + '"]').click();
      await page.waitForFunction(
        (prev) => {
          const input = document.querySelector('product-info product-form input[name="id"]');
          return input && input.value !== prev;
        },
        beforeId,
        { timeout: 8000 }
      );
      const elapsed = Date.now() - t0;
      await page.waitForTimeout(1500);
      const visible = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('#customily-cart-btn, product-form button[name="add"]'));
        return nodes
          .filter((b) => {
            if (b.getAttribute('data-myprintsy-atc-hidden') === '1') return false;
            const cs = getComputedStyle(b);
            return cs.display !== 'none' && cs.visibility !== 'hidden' && b.getBoundingClientRect().height > 8;
          })
          .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40));
      });
      assert.ok(visible.length >= 1, `legging Customily không còn nút ATC: ${JSON.stringify(visible)}`);
      assert.ok(visible.some((t) => /add to cart|sold out|unavailable/i.test(t)), `legging chữ lạ ${JSON.stringify(visible)}`);
      console.log(`PASS legging Customily ${next.value}: ${elapsed}ms, nút ${JSON.stringify(visible)}`);
    }
    assertNoOurErrors(pageErrors, 'legging');
    await page.close();
  } catch (e) {
    fail(e);
  }

  try {
    const { page, pageErrors } = await openPage(browser, MUG);
    await page.waitForTimeout(8000);
    const pre = await page.evaluate(() => {
      const legends = Array.from(document.querySelectorAll('variant-selects fieldset legend')).map((el) =>
        (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
      );
      const hasSize = legends.some((text) => /size/i.test(text) && !/pack|buy more/i.test(text));
      return { prefetch: window.__myprintsySizePrefetch || null, legends, hasSize };
    });
    assert.ok(pre.prefetch, 'mug chưa chạy size prefetch');
    if (pre.hasSize) assert.ok(pre.prefetch.queued >= 1, `mug có Size nhưng queued=${pre.prefetch.queued}`);
    else assert.ok(pre.prefetch.queued === 0, `mug không có Size nhưng queued=${pre.prefetch.queued} legends=${pre.legends.join(' | ')}`);
    const beforeId = await page.evaluate(() => document.querySelector('product-info product-form input[name="id"]')?.value || '');
    const pack = await page.evaluate(() => {
      const fs = Array.from(document.querySelectorAll('variant-selects fieldset')).find((el) =>
        /pack|buy more/i.test(el.querySelector('legend')?.textContent || '')
      );
      if (!fs) return { ok: false, reason: 'không thấy option Pack' };
      const radio = Array.from(fs.querySelectorAll('input[type="radio"]')).find((r) => !r.checked);
      if (!radio) return { ok: false, reason: 'không có pack khác' };
      return { ok: true, id: radio.id };
    });
    assert.ok(pack.ok, pack.reason);
    const t0 = Date.now();
    await page.locator('label[for="' + pack.id + '"]').click();
    await page.waitForFunction(
      (prev) => {
        const input = document.querySelector('product-info product-form input[name="id"]');
        return input && input.value !== prev;
      },
      beforeId,
      { timeout: 8000 }
    );
    const elapsed = Date.now() - t0;
    await page.waitForTimeout(1500);
    const visible = await page.evaluate(() => {
      const nodes = Array.from(document.querySelectorAll('#customily-cart-btn, product-form button[name="add"]'));
      return nodes
        .filter((b) => {
          if (b.getAttribute('data-myprintsy-atc-hidden') === '1') return false;
          const cs = getComputedStyle(b);
          return cs.display !== 'none' && cs.visibility !== 'hidden' && b.getBoundingClientRect().height > 8;
        })
        .map((b) => (b.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 40));
    });
    assert.ok(visible.some((t) => /add to cart|sold out|unavailable/i.test(t)), `mug sau Pack mất ATC: ${JSON.stringify(visible)}`);
    assertNoOurErrors(pageErrors, 'mug');
    console.log(
      `PASS mug pack: ${elapsed}ms, sizePrefetch=${pre.prefetch.queued}, legends=${JSON.stringify(pre.legends)}, nút ${JSON.stringify(visible)}`
    );
    await page.close();
  } catch (e) {
    fail(e);
  }

  await browser.close();
  process.exit(failed ? 1 : 0);
})();
