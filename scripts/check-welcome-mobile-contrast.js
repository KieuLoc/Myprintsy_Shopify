/**
 * Welcome mobile: cream text must sit on burgundy panel (not cream-on-cream).
 *   node scripts/check-welcome-mobile-contrast.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '183186358588';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;

function rgb(css) {
  const m = String(css).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(m, `parse ${css}`);
  return [+m[1], +m[2], +m[3]];
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(`${URL}&v=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, {
    timeout: 30000,
  });

  const data = await page.evaluate(async () => {
    for (const k of ['welcome-popup', 'cart-reminder-popup']) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(`${k}-session-shown`);
    }
    const host = [...document.querySelectorAll('cart-reminder-popup')].find((h) =>
      h.querySelector('.welcome-popup--mobile')
    );
    const modal = host.querySelector('.welcome-popup--mobile');
    host.dataset.enabled = 'true';
    modal.classList.add('is-open');
    document.querySelectorAll('#shopify-pc__banner,[id*=cookie]').forEach((n) => n.remove());
    const content = modal.querySelector('.welcome-popup__content');
    const heading = modal.querySelector('.cart-reminder-popup__heading');
    const dismiss = modal.querySelector('.welcome-popup__dismiss');
    const button = modal.querySelector('.welcome-popup__button');
    return {
      contentBg: getComputedStyle(content).backgroundColor,
      headingColor: getComputedStyle(heading).color,
      dismissColor: getComputedStyle(dismiss).color,
      buttonBg: getComputedStyle(button).backgroundColor,
      buttonColor: getComputedStyle(button).color,
      buttonOpacity: getComputedStyle(button).opacity,
    };
  });

  const [br, bg, bb] = rgb(data.contentBg);
  assert.ok(br > 80 && bg < 40 && bb < 40, `content burgundy ${data.contentBg}`);
  const [hr, hg, hb] = rgb(data.headingColor);
  assert.ok(hr + hg + hb > 500, `heading cream readable on burgundy ${data.headingColor}`);
  const [dr, dg, db] = rgb(data.dismissColor);
  assert.ok(dr + dg + db > 500, `dismiss cream ${data.dismissColor}`);
  assert.ok(parseFloat(data.buttonOpacity) >= 0.9, `button opacity ${data.buttonOpacity}`);

  await page.screenshot({ path: 'scripts/_shots/welcome-mobile-contrast.png' });
  console.log('PASS', data.contentBg, data.headingColor, data.buttonOpacity);
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
