/**
 * Check: "Pairs well with" (complementary block) lists products set in Search & Discovery,
 * below the last collapsible tab, collapsed (caret like other tabs) until clicked,
 * each with a "Choose options →" link that opens that product page; products without
 * complementary products show no block.
 *   WITH=<handle that has complementary products>  WITHOUT=<handle that has none>
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const WITH = process.env.WITH || 'follow-the-moon-home-personalized-witchcraft-accent-mug-hwthah2g18';
const WITHOUT = process.env.WITHOUT || 'pickleball-lover-personalized-mug-pklaah2a03';

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup,welcome-popup,welcome-step2-popup{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

async function open(browser, handle) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(HIDE_OVERLAY);
  await page.goto(`${BASE}/products/${handle}?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  return page;
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const check = async (name, fn) => {
    try { await fn(); console.log(`PASS ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
  };

  await check(`${WITH} shows Pairs well with + Choose options links`, async () => {
    const page = await open(browser, WITH);
    try {
      const t0 = Date.now();
      await page.waitForSelector('product-recommendations.complementary-products aside', { timeout: 15000 })
        .catch(() => { throw new Error(`no Pairs well with block after ${Date.now() - t0}ms (complementary products set in Search & Discovery?)`); });
      console.log(`  block loaded ${Date.now() - t0}ms`);
      const pos = await page.evaluate(() => {
        const block = document.querySelector('product-recommendations.complementary-products');
        const tabs = [...document.querySelectorAll('.product__info-container .product__accordion:not(aside)')]
          .filter((t) => !block.contains(t));
        const last = tabs[tabs.length - 1];
        return { lastTab: last?.querySelector('.accordion__title')?.textContent.trim(), after: !!last && !!(last.compareDocumentPosition(block) & Node.DOCUMENT_POSITION_FOLLOWING) };
      });
      assert.ok(pos.after, `block not below last tab "${pos.lastTab}"`);
      const details = page.locator('.complementary-products details');
      assert.ok(!(await details.evaluate((d) => d.open)), 'Pairs well with is open by default (want collapsed)');
      assert.ok(!(await page.locator('.complementary-products a.quick-add__submit').first().isVisible()), 'items visible while collapsed');
      assert.ok(await page.locator('.complementary-products summary .icon-caret').isVisible(), 'no caret icon (same as other tabs)');
      await page.locator('.complementary-products summary').click();
      assert.ok(await details.evaluate((d) => d.open), 'click + did not open the list');
      console.log(`  below "${pos.lastTab}", collapsed by default, opens on click`);
      const items = await page.$$eval('.complementary-products .complementary-slide li', (lis) => lis.map((li) => ({
        title: li.querySelector('.card__heading a')?.textContent.trim(),
        href: li.querySelector('a.quick-add__submit')?.getAttribute('href'),
        cta: li.querySelector('a.quick-add__submit')?.textContent.trim(),
      })));
      assert.ok(items.length > 0, `0 items`);
      for (const it of items) {
        assert.ok(it.href && it.href.includes('/products/'), `"${it.title}" CTA href ${it.href}`);
        assert.ok(/choose options/i.test(it.cta || ''), `"${it.title}" CTA text "${it.cta}"`);
      }
      console.log(`  ${items.length} items: ${items.map((i) => i.title).join(' | ')}`);
      const cta = page.locator('.complementary-products a.quick-add__submit').first();
      await cta.scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'scripts/pairs-well-with.png', clip: await page.locator('.complementary-products').boundingBox() });
      const want = new URL(items[0].href, BASE).pathname;
      await Promise.all([page.waitForURL((u) => u.pathname === want, { timeout: 30000 }), cta.click()]);
      assert.ok(!(await page.locator('quick-add-modal[open]').count()), 'quick-add modal opened instead of navigating');
    } finally { await page.close(); }
  });

  await check(`${WITHOUT} has no Pairs well with block`, async () => {
    const page = await open(browser, WITHOUT);
    try {
      await page.waitForTimeout(6000);
      const n = await page.locator('product-recommendations.complementary-products aside').count();
      assert.strictEqual(n, 0, `found ${n} Pairs well with blocks`);
    } finally { await page.close(); }
  });

  await browser.close();
  process.exit(failed ? 1 : 0);
})();
