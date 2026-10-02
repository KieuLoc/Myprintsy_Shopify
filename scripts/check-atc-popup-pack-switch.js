/**
 * Scenario check (the reported bug): add Pack 1, close the popup, switch to Pack 2, add again.
 * The popup image must be the photo the shopper sees in the gallery at click time — not the
 * previous Pack's render still sitting in Customily's demoted canvas.
 *
 * The storefront blocks headless traffic (redirects to google.com), so run it headed:
 *   $env:HEADED=1; $env:BASE_URL='https://www.myprintsy.com'; node scripts/check-atc-popup-pack-switch.js
 * BASE_URL may also be a local theme server; `shopify theme dev` currently refuses this theme
 * (its Liquid parser rejects `render` args with filters in several snippets).
 */
const assert = require('node:assert');
const { chromium, devices } = require('playwright');

const BASE = process.env.BASE_URL || process.env.THEME_DEV_URL || 'http://127.0.0.1:9292';
const PATH =
  '/products/pickleball-lover-personalized-mug-pklaah2a03?variant=53039180513596' +
  (process.env.PREVIEW_THEME_ID ? `&preview_theme_id=${process.env.PREVIEW_THEME_ID}` : '');

const HIDE_OVERLAYS = `
  const s = document.createElement('style');
  s.textContent = 'welcome-popup,welcome-step2-popup,cart-reminder-popup,.shopify-pc__banner,' +
    '#shopify-pc__banner,div[class*="kl-private-reset"]{display:none!important;pointer-events:none!important}';
  document.documentElement.appendChild(s);
`;

/** Compare Shopify CDN urls without width/version noise; keep data:/blob: distinguishable. */
function imageId(src) {
  const s = String(src || '');
  if (/^data:/i.test(s)) return `data:(${s.length} chars)`;
  if (/^blob:/i.test(s)) return 'blob:';
  return s.split('?')[0].split('/').pop() || s;
}

/** 16x16 grey fingerprint of an image URL, decoded in the page. */
async function fingerprint(page, url) {
  return page.evaluate(async (u) => {
    const img = new Image();
    img.src = u;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, 16, 16);
    const d = ctx.getImageData(0, 0, 16, 16).data;
    const out = [];
    for (let i = 0; i < d.length; i += 4) out.push(Math.round((d[i] + d[i + 1] + d[i + 2]) / 3));
    return out;
  }, url);
}

/** Screenshot of the gallery area the shopper is looking at — independent of our own resolver. */
async function galleryFingerprint(page) {
  const el = await page.$(
    '.customily_gallery_media, .product__media-item.is-active .product-media-container, .product-media-container'
  );
  assert.ok(el, 'no gallery element to screenshot');
  const buf = await el.screenshot();
  return fingerprint(page, `data:image/png;base64,${buf.toString('base64')}`);
}

const greyDistance = (a, b) => Math.round(a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length);

const visibleMainImage = () => {
  const pinned =
    document.querySelector('.product__media-item.is-active .product-media-container > img.myprintsy-shopify-fallback') ||
    document.querySelector('.product-media-container > img.myprintsy-shopify-fallback');
  const active =
    document.querySelector('.product__media-item.is-active img') ||
    document.querySelector('media-gallery .product__media img') ||
    document.querySelector('.product__media img');
  const el = pinned || active;
  return el ? el.currentSrc || el.getAttribute('src') || '' : '';
};

async function selectPack(page, label) {
  const clicked = await page.evaluate((want) => {
    const scope = document.querySelector('variant-selects') || document;
    // Labels read "Pack 1Variant sold out or unavailable" — no word boundary after the digit.
    const hit = Array.from(scope.querySelectorAll('label, .product-form__input label')).find((l) =>
      new RegExp(`^\\s*${want}(?!\\d)`, 'i').test(l.textContent.replace(/\s+/g, ' ').trim())
    );
    if (!hit) return null;
    hit.click();
    return hit.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
  }, label);
  assert.ok(clicked, `could not find the "${label}" option`);
  await page.waitForTimeout(4500);
  return clicked;
}

async function typeFirstName(page, name) {
  return page.evaluate((value) => {
    const el = document.querySelector(
      '#customily-options input[type="text"], #cl_optionsapp input[type="text"], .customily_option input[type="text"], input[name*="Enter Name" i]'
    );
    if (!el) return null;
    el.removeAttribute('readonly');
    el.removeAttribute('disabled');
    el.focus();
    el.value = value;
    ['input', 'change', 'keyup', 'blur'].forEach((e) => el.dispatchEvent(new Event(e, { bubbles: true })));
    return el.name || el.id;
  }, name);
}

/**
 * Customily blocks submit until every required option is answered. The swatch options
 * (e.g. "Add Box for Protection") are Vue radiogroups inside a collapsed accordion, so
 * open the accordion and click a swatch label — clicking the input alone does nothing.
 */
async function answerRequiredOptions(page) {
  const state = await page.evaluate(() => {
    const done = [];
    document.querySelectorAll('.customily_option').forEach((opt) => {
      const radios = Array.from(opt.querySelectorAll('input[type="radio"]'));
      if (!radios.length || radios.some((r) => r.checked)) return;
      opt.querySelector('label[role="button"]')?.click();
      const first = radios[0];
      const label = opt.querySelector(`label[for="${first.id}"]`) || first.closest('.customily-swatch')?.querySelector('label');
      if (label) label.click();
      else {
        first.click();
        first.dispatchEvent(new Event('change', { bubbles: true }));
      }
      done.push((opt.textContent.match(/Option \d+ of \d+\s*(.{0,32})/) || [, '?'])[1].trim());
    });
    return done;
  });
  await page.waitForTimeout(2000);

  const unanswered = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.customily_option'))
      .filter((opt) => {
        const radios = Array.from(opt.querySelectorAll('input[type="radio"]'));
        return radios.length && !radios.some((r) => r.checked);
      })
      .map((opt) => opt.textContent.replace(/\s+/g, ' ').trim().slice(0, 40))
  );
  assert.deepStrictEqual(unanswered, [], `required options still unanswered: ${unanswered.join(' | ')}`);
  return state;
}

async function addToCartAndReadPopup(page) {
  const mainAtClick = await page.evaluate(visibleMainImage);
  const galleryFp = await galleryFingerprint(page);

  // Same call the ATC button makes (customily-preview-atc.js openCartNotificationOptimistic).
  // A real submit is not drivable here: Customily's widget refuses programmatic input, and
  // Shopify answers automated /cart/add with an empty cart anyway.
  const opened = await page.evaluate(() => {
    const cart = document.querySelector('cart-notification');
    if (!cart || typeof cart.openOptimistic !== 'function') return false;
    cart.openOptimistic({ fromUserGesture: true });
    return true;
  });
  assert.ok(opened, 'cart-notification has no openOptimistic');

  // open() portals the wrapper out of <cart-notification> into #cart-notification-portal.
  await page.waitForSelector('.cart-notification-wrapper.is-open', { timeout: 15000 });
  await page.waitForTimeout(1500);

  const popup = await page.evaluate(async () => {
    const img = document.querySelector(
      '.cart-notification-wrapper.is-open .cart-notification-product__image img, .cart-notification-wrapper.is-open img'
    );
    if (!img) return { src: '', painted: false };
    const isPainted = () => img.complete && img.naturalWidth > 0;
    // Give the image time to arrive; sampling once makes this flaky, not strict.
    const painted = await new Promise((resolve) => {
      if (isPainted()) return resolve(true);
      img.addEventListener('load', () => resolve(true), { once: true });
      img.addEventListener('error', () => resolve(false), { once: true });
      setTimeout(() => resolve(isPainted()), 5000);
    });
    return { src: img.currentSrc || img.getAttribute('src') || '', painted };
  });

  const popupFp = popup.src ? await fingerprint(page, popup.src) : null;
  return { mainAtClick, popup: popup.src, painted: popup.painted, galleryFp, popupFp };
}

async function closePopup(page) {
  await page.evaluate(() => document.querySelector('cart-notification')?.close?.());
  await page.waitForSelector('.cart-notification-wrapper.is-open', { state: 'detached', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);
}

(async () => {
  const browser = await chromium.launch(
    process.env.HEADED ? { headless: false, channel: 'chrome' } : { headless: true }
  );
  const ctx = await browser.newContext(devices['iPhone 13']);
  const page = await ctx.newPage();
  await page.addInitScript(HIDE_OVERLAYS);
  // The region-restrictions app (ip-blocker-embed.js) bounces automated visits to google.com.
  await page.route('**/ip-blocker-embed*', (route) => route.abort());

  let reached = false;
  for (let attempt = 1; attempt <= 4 && !reached; attempt++) {
    await page.goto(BASE + PATH, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
    reached = await page
      .waitForSelector('product-info', { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!reached) console.error(`attempt ${attempt}: no product-info, landed on ${page.url().slice(0, 60)}`);
  }
  assert.ok(reached, `storefront never served the PDP (bot mitigation?) — last url ${page.url()}`);
  await page.waitForTimeout(12000);

  // Make sure we are looking at the theme that carries the fix, not the live one.
  const hasFix = await page.evaluate(
    () => !!customElements.get('cart-notification')?.prototype?.hasPinnedShopifyPhoto
  );
  assert.ok(hasFix, `served theme has no hasPinnedShopifyPhoto — wrong theme? url ${page.url()}`);

  const packOne = await selectPack(page, 'Pack 1');
  await typeFirstName(page, 'Anna');
  await answerRequiredOptions(page);
  await page.waitForTimeout(4000);
  const first = await addToCartAndReadPopup(page);
  await closePopup(page);

  const packTwo = await selectPack(page, 'Pack 2');
  await typeFirstName(page, 'Bella');
  await answerRequiredOptions(page);
  await page.waitForTimeout(4000);
  const second = await addToCartAndReadPopup(page);

  await page.screenshot({ path: 'scripts/.out-pack-switch.png' });
  await browser.close();

  const report = {
    packOne,
    packTwo,
    first: { gallery: imageId(first.mainAtClick), popup: imageId(first.popup), painted: first.painted },
    second: { gallery: imageId(second.mainAtClick), popup: imageId(second.popup), painted: second.painted },
  };
  // Pixels beat URLs: on mobile Customily owns the gallery and the popup carries a canvas capture,
  // so compare each popup image against a screenshot of the gallery at click time. Each popup must
  // look more like ITS OWN pack than like the other one.
  const own1 = greyDistance(first.popupFp, first.galleryFp);
  const own2 = greyDistance(second.popupFp, second.galleryFp);
  const cross1 = greyDistance(first.popupFp, second.galleryFp);
  const cross2 = greyDistance(second.popupFp, first.galleryFp);
  console.log({ ...report, distances: { own1, own2, cross1, cross2 } });

  assert.ok(first.popup, 'Pack 1: popup has no image at all');
  assert.ok(second.popup, 'Pack 2: popup has no image at all');
  assert.ok(own1 < cross1, `Pack 1: popup looks like Pack 2's gallery (own ${own1} vs other ${cross1})`);
  assert.ok(
    own2 < cross2,
    `Pack 2 (the reported bug): popup still looks like Pack 1's gallery (own ${own2} vs other ${cross2})`
  );
  assert.notStrictEqual(imageId(first.popup), imageId(second.popup), 'both packs produced the same popup image');
  // The reported symptom was a popup image that never rendered.
  assert.ok(first.painted, 'Pack 1: popup image did not render');
  assert.ok(second.painted, 'Pack 2: popup image did not render');
  console.log('OK — popup image follows the gallery across a Pack switch');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
