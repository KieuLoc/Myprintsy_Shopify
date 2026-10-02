/**
 * Unit check: Welcome and Cart reminder never stack (local file, no push).
 * Whichever shows first blocks the other for 2 minutes, both directions, and the blocked
 * one retries when the window is over instead of being dropped for the session.
 *
 *   node scripts/check-overlay-peer-cooldown.js
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { chromium } = require('playwright');

const ASSET = path.join(__dirname, '..', 'assets', 'overlay-cart-reminder-popup.js');
const TWO_MIN = 2 * 60 * 1000;

function classSource() {
  const src = fs.readFileSync(ASSET, 'utf8');
  const cut = src.indexOf("customElements.define('cart-reminder-popup'");
  assert.ok(cut > 0, "expected customElements.define('cart-reminder-popup', ...)");
  // The file is `if (!customElements.get(...)) { class ...; define(...) }` — swap the define
  // for an export and close the block.
  return `${src.slice(0, cut)}\nwindow.__CRP = CartReminderPopup;\n}`;
}

/**
 * @param {{ self: 'welcome'|'reminder', peerShownAgoMs: number|null, peerOpen: boolean }} scene
 */
async function run(page, scene) {
  return page.evaluate(
    async ([s, twoMin]) => {
      const CRP = window.__CRP;
      const make = (key, isOpen) => {
        const el = Object.create(CRP.prototype);
        el.storageKey = key;
        el.modal = document.createElement('div');
        el.modal.className = 'cart-reminder-popup';
        if (isOpen) el.modal.classList.add('is-open');
        return el;
      };

      const selfKey = s.self === 'welcome' ? 'welcome-popup' : 'cart-reminder-popup';
      const peerKey = s.self === 'welcome' ? 'cart-reminder-popup' : 'welcome-popup';
      const me = make(selfKey, false);
      const peer = make(peerKey, s.peerOpen);
      CRP.instances = new Set([me, peer]);

      localStorage.removeItem(selfKey);
      localStorage.removeItem(peerKey);
      if (s.peerShownAgoMs !== null) localStorage.setItem(peerKey, String(Date.now() - s.peerShownAgoMs));

      // Spy on the two ways out of tryOpen.
      const calls = { scheduled: null, opened: false };
      me.scheduleOpen = (delay) => {
        calls.scheduled = delay;
      };
      me.open = () => {
        calls.opened = true;
      };
      // Everything past the peer gate says "yes" so only the gate is under test.
      me.canShowWelcome = () => true;
      me.canShow = () => true;
      me.isCheckoutPage = () => false;
      me.isCartPage = () => false;
      me.clearTimers = () => {};
      me.refreshCartCount = async () => 1;

      await me.tryOpen('unit-check');
      return { left: me.peerCooldownLeftMs(), ...calls, twoMin };
    },
    [scene, TWO_MIN]
  );
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  // localStorage needs a real origin; serve one locally so the check stays offline.
  await page.route('https://overlay.check/', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' })
  );
  await page.goto('https://overlay.check/');
  await page.addScriptTag({ content: classSource() });

  const scenes = {
    // Welcome showed 10s ago -> cart reminder must wait out the rest of the 2 min.
    reminderAfterWelcome: await run(page, { self: 'reminder', peerShownAgoMs: 10000, peerOpen: false }),
    // ...and the same the other way round.
    welcomeAfterReminder: await run(page, { self: 'welcome', peerShownAgoMs: 10000, peerOpen: false }),
    // 2 min are over -> free to open.
    afterCooldown: await run(page, { self: 'reminder', peerShownAgoMs: TWO_MIN + 5000, peerOpen: false }),
    // Peer never shown -> free to open.
    peerNeverShown: await run(page, { self: 'reminder', peerShownAgoMs: null, peerOpen: false }),
    // Cooldown over but the peer is still on screen -> short retry, never stack.
    peerStillOpen: await run(page, { self: 'reminder', peerShownAgoMs: TWO_MIN + 5000, peerOpen: true }),
  };
  await browser.close();
  console.log(scenes);

  const blocked = (s, label) => {
    assert.strictEqual(s.opened, false, `${label}: must not open while the other popup holds the slot`);
    assert.ok(s.scheduled > 0, `${label}: must reschedule, got ${s.scheduled}`);
  };
  blocked(scenes.reminderAfterWelcome, 'reminder after welcome');
  blocked(scenes.welcomeAfterReminder, 'welcome after reminder');
  blocked(scenes.peerStillOpen, 'peer still open');

  assert.ok(
    scenes.reminderAfterWelcome.left > TWO_MIN - 12000 && scenes.reminderAfterWelcome.left <= TWO_MIN - 9000,
    `wait must be the remainder of the 2 min, got ${scenes.reminderAfterWelcome.left}ms`
  );
  assert.ok(scenes.peerStillOpen.left <= 5000, `stacking guard should be a short retry, got ${scenes.peerStillOpen.left}ms`);

  assert.strictEqual(scenes.afterCooldown.left, 0, 'cooldown must expire');
  assert.strictEqual(scenes.afterCooldown.opened, true, 'must open once the 2 min are over');
  assert.strictEqual(scenes.peerNeverShown.left, 0, 'no peer history means no wait');
  assert.strictEqual(scenes.peerNeverShown.opened, true, 'must open when the other popup never showed');
  console.log('OK — 2 min gap both ways, blocked show is retried, never stacked');
})().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
