/**
 * Welcome: Admin "Excluded product codes" must block auto-show on matching PDP handles.
 *
 * Branches:
 *   - handle ends with -{code} → excluded
 *   - exact handle === code → excluded
 *   - other product / empty list / homepage (no handle) → not excluded
 *
 *   node scripts/check-welcome-excluded-product-codes.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const JS = path.join(__dirname, '..', 'assets', 'overlay-cart-reminder-popup.js');
const LIQ_D = path.join(__dirname, '..', 'sections', 'overlay-welcome-popup.liquid');
const LIQ_M = path.join(__dirname, '..', 'sections', 'overlay-welcome-popup-mobile.liquid');

const src = fs.readFileSync(JS, 'utf8');
const liqD = fs.readFileSync(LIQ_D, 'utf8');
const liqM = fs.readFileSync(LIQ_M, 'utf8');

assert.ok(src.includes('isProductCodeExcluded'), 'JS missing isProductCodeExcluded');
assert.ok(src.includes('excludedProductCodes') || src.includes('excluded-product-codes'), 'JS missing codes dataset');
assert.ok(liqD.includes('excluded_product_codes'), 'desktop liquid missing setting');
assert.ok(liqM.includes('excluded_product_codes'), 'mobile liquid missing setting');
assert.ok(liqD.includes('data-excluded-product-codes'), 'desktop liquid missing data attr');
assert.ok(liqM.includes('data-excluded-product-codes'), 'mobile liquid missing data attr');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.route('https://welcome.exclude/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body></body></html>' })
  );
  await page.goto('https://welcome.exclude/', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: src });
  await page.waitForFunction(() => !!customElements.get('cart-reminder-popup'));

  const results = await page.evaluate(() => {
    function mount({ handle, codes }) {
      const codesJson = JSON.stringify(codes || []).replace(/"/g, '&quot;');
      document.body.innerHTML = `
        <cart-reminder-popup
          data-storage-key="welcome-popup"
          data-product-handle="${handle || ''}"
          data-excluded-product-codes="${codesJson}"
          data-enabled="true"
          data-device-target="desktop"
          data-once-per-session="false"
          data-frequency-cap="0"
          data-frequency-cap-seconds="0"
          data-order-suppression-days="0"
          data-disable-homepage="false"
          data-excluded-pages="[]"
          data-page-type="${handle ? 'product' : 'index'}"
        >
          <div class="cart-reminder-popup" aria-hidden="true"></div>
        </cart-reminder-popup>`;
      const el = document.querySelector('cart-reminder-popup');
      customElements.upgrade(el);
      try {
        sessionStorage.clear();
        localStorage.clear();
      } catch (_) {}
      return {
        excluded: el.isProductCodeExcluded(),
        canShow: el.canShowWelcome(),
        storageKey: el.storageKey,
        handle: el.dataset.productHandle,
        codes: el.getExcludedProductCodes(),
      };
    }

    const code = 'upthah2e13';
    return {
      matchSuffix: mount({
        handle: 'mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-upthah2e13',
        codes: [code],
      }),
      matchExact: mount({ handle: code, codes: [code] }),
      noMatch: mount({
        handle: 'pickleball-lover-personalized-mug-pklaah2a03',
        codes: [code],
      }),
      emptyList: mount({
        handle: 'mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-upthah2e13',
        codes: [],
      }),
      homepage: mount({ handle: '', codes: [code] }),
      caseInsensitive: mount({
        handle: 'Foo-UPTHAH2E13',
        codes: ['  UpThAh2E13  '],
      }),
      pathFallback: (() => {
        document.body.innerHTML = `
          <cart-reminder-popup
            data-storage-key="welcome-popup"
            data-product-handle=""
            data-current-path="/products/just-one-more-chapter-personalized-tumbler-cup-gifts-for-book-lovers-rblaah1y16"
            data-excluded-product-codes="[&quot;rblaah1y16&quot;]"
            data-enabled="true"
            data-device-target="desktop"
            data-once-per-session="false"
            data-frequency-cap="0"
            data-frequency-cap-seconds="0"
            data-order-suppression-days="0"
            data-disable-homepage="false"
            data-excluded-pages="[]"
            data-page-type="product"
          >
            <div class="cart-reminder-popup" aria-hidden="true"></div>
          </cart-reminder-popup>`;
        const el = document.querySelector('cart-reminder-popup');
        customElements.upgrade(el);
        try {
          sessionStorage.clear();
          localStorage.clear();
        } catch (_) {}
        return { excluded: el.isProductCodeExcluded(), handle: el.getProductHandle() };
      })(),
    };
  });

  await browser.close();
  console.log(results);

  assert.ok(results.matchSuffix.excluded, 'suffix handle must be excluded');
  assert.ok(!results.matchSuffix.canShow, 'canShowWelcome false on excluded suffix');
  assert.ok(results.matchExact.excluded, 'exact handle must be excluded');
  assert.ok(!results.noMatch.excluded, 'other product must not be excluded');
  assert.ok(results.noMatch.canShow, 'canShowWelcome true on other product');
  assert.ok(!results.emptyList.excluded, 'empty list must not exclude');
  assert.ok(!results.homepage.excluded, 'homepage (no handle) must not exclude');
  assert.ok(results.caseInsensitive.excluded, 'codes must match case-insensitively trimmed');
  assert.strictEqual(results.pathFallback.handle, 'just-one-more-chapter-personalized-tumbler-cup-gifts-for-book-lovers-rblaah1y16');
  assert.ok(results.pathFallback.excluded, 'pathname fallback must exclude matching code');

  console.log('OK — excluded product codes block Welcome on matching handles only');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
