/**
 * Unit check: View Cart button while /cart/add is in flight (local file, no push).
 * Counts down 5 → 1, then stays "Loading…", and must stay unclickable the whole time.
 *
 *   node scripts/check-atc-countdown.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'cart-notification.js');

function classSource() {
  const src = fs.readFileSync(ASSET, 'utf8');
  const cut = src.indexOf("customElements.define('cart-notification'");
  assert.ok(cut > 0, 'expected customElements.define at the end of cart-notification.js');
  return `${src.slice(0, cut)}\nwindow.__CartNotification = CartNotification;`;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('about:blank');
  await page.addScriptTag({ content: classSource() });

  const frames = await page.evaluate(async () => {
    document.body.innerHTML = '<a id="cart-notification-button" href="/cart">View Cart &amp; Checkout</a>';
    const btn = document.getElementById('cart-notification-button');
    const self = Object.create(window.__CartNotification.prototype);
    self.startCheckoutCountdown();

    const seen = [];
    const snap = () => seen.push({ text: btn.textContent.trim(), href: btn.getAttribute('href'), off: btn.getAttribute('aria-disabled') });
    snap();
    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      snap();
    }
    self.resetCheckoutCountdownButton();
    snap();
    return seen;
  });
  await browser.close();
  console.log(frames.map((f, i) => `${i}s: ${f.text}`).join(' | '));

  assert.strictEqual(frames[0].text, 'Loading… 5s', `must start at 5s, got "${frames[0].text}"`);
  assert.strictEqual(frames[4].text, 'Loading… 1s', `must reach 1s at t=4s, got "${frames[4].text}"`);
  assert.strictEqual(frames[5].text, 'Loading…', `must drop the number after 5s, got "${frames[5].text}"`);
  assert.strictEqual(frames[6].text, 'Loading…', 'must not count up or unlock on its own');
  frames.slice(0, 7).forEach((f, i) => {
    assert.strictEqual(f.href, null, `t=${i}s: href must stay removed while adding`);
    assert.strictEqual(f.off, 'true', `t=${i}s: button must stay aria-disabled while adding`);
  });
  const done = frames[frames.length - 1];
  assert.strictEqual(done.text, 'View Cart & Checkout', 'reset must restore the label');
  assert.strictEqual(done.href, '/cart', 'reset must restore the href');
  console.log('OK — 5→1 then Loading…, locked until the add resolves');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
