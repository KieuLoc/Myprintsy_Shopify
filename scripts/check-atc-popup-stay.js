/**
 * Big Sis mug, DEV theme: Customily re-fires ATC after the option widget rebuilds.
 * That second pass used to click a collapsed option label and the cart popup treated
 * it as an outside click, so the popup closed even though /cart/add succeeded.
 *
 * A) required flowers empty -> popup stays closed, no /cart/add
 * B) flowers + names filled -> popup opens and is still open 2.5s after /cart/add
 *
 *   node scripts/check-atc-popup-stay.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = '186878558524';
const URL =
  'https://www.myprintsy.com/products/big-sis-and-lil-sis-personalized-ceramic-white-mug-gift-for-sisters-ssthah4o14?preview_theme_id=' +
  THEME;

function typeNames() {
  function setName(nameAttr, value) {
    const field = document.querySelector('input[name="' + nameAttr + '"]');
    if (!field) return false;
    field.removeAttribute('readonly');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
    field.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }
  return (
    setName('properties[_Enter Name #1]', 'Alex') && setName('properties[_Enter Name #2]', 'Sam')
  );
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    const style = document.createElement('style');
    style.textContent =
      '.cart-reminder-popup,.welcome-popup,.success-opt-in-popup,#PBarNextFrameWrapper,#shopify-pc__banner,.overlay-section--welcome-desktop{display:none!important;pointer-events:none!important}';
    document.documentElement.appendChild(style);
  });

  const adds = [];
  page.on('response', (response) => {
    if (/\/cart\/add/i.test(response.url()) && response.request().method() === 'POST') {
      adds.push(response.status());
    }
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('#customily-cart-btn', { state: 'attached', timeout: 30000 });
  await page.waitForTimeout(8000);

  const popupOpen = () =>
    page.evaluate(() => Boolean(document.querySelector('.cart-notification-wrapper.is-open')));

  const clearBlockers = () =>
    page.evaluate(() => {
      document
        .querySelectorAll(
          '#PBarNextFrameWrapper, .cart-reminder-popup, .welcome-popup, .success-opt-in-popup, #shopify-pc__banner, .overlay-section--welcome-desktop'
        )
        .forEach((el) => el.remove());
    });

  // A) required flowers still empty
  await clearBlockers();
  await page.locator('#customily-cart-btn').click();
  await page.waitForTimeout(2000);
  const blockedOpen = await popupOpen();
  const addsWhileBlocked = adds.length;
  assert.strictEqual(blockedOpen, false, 'popup opened while a flower was unanswered');
  assert.strictEqual(addsWhileBlocked, 0, `blocked ATC posted /cart/add (${addsWhileBlocked})`);

  await clearBlockers();
  const flower1 = page.locator('.customily_option', { hasText: 'Flower #1' }).locator('label.needsclick').nth(3);
  const flower2 = page.locator('.customily_option', { hasText: 'Flower #2' }).locator('label.needsclick').nth(2);
  await flower1.click();
  await flower2.click();
  const named = await page.evaluate(typeNames);
  assert.ok(named, 'name inputs were not on the page');
  const picked = await page.evaluate(() =>
    [...document.querySelectorAll('.customily_option')]
      .filter((opt) => /Flower #/i.test(opt.innerText || ''))
      .every((opt) => [...opt.querySelectorAll('input[type="radio"]')].some((radio) => radio.checked))
  );
  assert.ok(picked, 'flower radios were not checked');

  // B) filled form: popup must survive the second Customily click
  const addDone = page.waitForResponse(
    (response) => /\/cart\/add/i.test(response.url()) && response.request().method() === 'POST',
    { timeout: 15000 }
  );
  const t0 = Date.now();
  await clearBlockers();
  await page.locator('#customily-cart-btn').click();
  await page.waitForSelector('.cart-notification-wrapper.is-open', { timeout: 2500 });
  const openMs = Date.now() - t0;
  const add = await addDone;
  const addMs = Date.now() - t0;
  await page.waitForTimeout(2500);
  const stillOpen = await popupOpen();
  const href = page.url();

  await browser.close();

  console.log({ blockedOpen, addsWhileBlocked, openMs, addStatus: add.status(), addMs, stillOpen, href });
  assert.ok(openMs < 2500, `popup opened ${openMs}ms`);
  assert.strictEqual(add.status(), 200, `cart/add status ${add.status()} after ${addMs}ms`);
  assert.ok(stillOpen, `popup closed ${addMs + 2500}ms after click (add returned in ${addMs}ms)`);
  assert.ok(href.includes('ssthah4o14'), `page left the product: ${href}`);
  console.log(`OK — blocked: no popup; filled: popup open ${openMs}ms, still open after add ${addMs}ms`);
})().catch((error) => {
  console.error('FAIL', error.message);
  process.exit(1);
});
