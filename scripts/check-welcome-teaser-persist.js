/**
 * Welcome gift-box teaser must survive full page navigations after Welcome closes.
 *
 * Before: teaser only painted in close() of the current document — a new product URL rebuilt
 * the DOM with the teaser hidden and never restored it.
 * After: showActiveTeaser() sets sessionStorage welcome-teaser-active; connectedCallback restores.
 *
 * Branches: active flag → visible; dismissed → stays hidden.
 *
 *   node scripts/check-welcome-teaser-persist.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'overlay-welcome-step2.js');
const SRC = fs.readFileSync(ASSET, 'utf8');

assert.ok(SRC.includes('TEASER_ACTIVE_KEY'), 'expected TEASER_ACTIVE_KEY');
assert.ok(SRC.includes('shouldRestoreTeaser'), 'expected shouldRestoreTeaser');

const MARKUP = `
  <welcome-step2-popup data-device-target="desktop">
    <div class="success-opt-in-popup" aria-hidden="true"></div>
    <button type="button" data-welcome-teaser hidden aria-hidden="true">gift</button>
  </welcome-step2-popup>
`;

async function remount(page) {
  // Keep the same origin so sessionStorage survives (setContent would jump to about:blank).
  await page.evaluate((html) => {
    document.body.innerHTML = html;
  }, MARKUP);
  await page.evaluate(() => customElements.upgrade(document.querySelector('welcome-step2-popup')));
  await page.evaluate(() => new Promise((r) => queueMicrotask(r)));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.route('https://teaser.check/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><html><body>${MARKUP}</body></html>`,
    })
  );
  await page.goto('https://teaser.check/', { waitUntil: 'domcontentloaded' });
  await page.addScriptTag({ content: SRC });
  await page.waitForFunction(() => !!customElements.get('welcome-step2-popup'));
  await page.evaluate(() => customElements.upgrade(document.querySelector('welcome-step2-popup')));
  await page.evaluate(() => sessionStorage.clear());
  // Fresh mount after clear so restore does not fire from a leftover flag.
  await remount(page);

  // Branch A: Welcome.close → showActiveTeaser → remount still visible
  const afterClose = await page.evaluate(() => {
    const Cls = customElements.get('welcome-step2-popup');
    Cls.showActiveTeaser();
    const teaser = document.querySelector('[data-welcome-teaser]');
    return {
      active: sessionStorage.getItem(Cls.TEASER_ACTIVE_KEY),
      visible: !!(teaser && !teaser.hidden && teaser.classList.contains('is-visible')),
    };
  });
  assert.strictEqual(afterClose.active, '1', `flag after showActiveTeaser: ${afterClose.active}`);
  assert.ok(afterClose.visible, 'teaser must paint after showActiveTeaser');

  await remount(page);
  const afterNav = await page.evaluate(() => {
    const Cls = customElements.get('welcome-step2-popup');
    const teaser = document.querySelector('[data-welcome-teaser]');
    return {
      should: Cls.shouldRestoreTeaser(),
      visible: !!(teaser && !teaser.hidden && teaser.classList.contains('is-visible')),
      active: sessionStorage.getItem(Cls.TEASER_ACTIVE_KEY),
    };
  });
  assert.strictEqual(afterNav.active, '1', 'session flag must survive remount');
  assert.ok(afterNav.should, 'shouldRestoreTeaser must be true after remount');
  assert.ok(afterNav.visible, 'teaser must restore after remount');

  // Branch B: dismiss → remount stays hidden
  await page.evaluate(() => document.querySelector('welcome-step2-popup').dismissTeaser());
  await remount(page);
  const afterDismiss = await page.evaluate(() => {
    const Cls = customElements.get('welcome-step2-popup');
    const teaser = document.querySelector('[data-welcome-teaser]');
    return {
      should: Cls.shouldRestoreTeaser(),
      dismissed: Cls.isTeaserDismissed(),
      visible: !!(teaser && !teaser.hidden && teaser.classList.contains('is-visible')),
      activeGone: sessionStorage.getItem(Cls.TEASER_ACTIVE_KEY) !== '1',
    };
  });
  assert.ok(afterDismiss.dismissed, 'dismiss must set TEASER_DISMISS_KEY');
  assert.ok(afterDismiss.activeGone, 'dismiss must clear TEASER_ACTIVE_KEY');
  assert.ok(!afterDismiss.should, 'shouldRestoreTeaser must be false after dismiss');
  assert.ok(!afterDismiss.visible, 'dismissed teaser must not restore');

  await browser.close();
  console.log({ afterClose, afterNav, afterDismiss });
  console.log('OK — teaser persists across remount; dismissed stays gone');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
