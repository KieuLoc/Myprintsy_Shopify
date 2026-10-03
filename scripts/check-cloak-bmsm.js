/**
 * Check: product types containing "cloak" show the Buy More, Save More box (like product.buy-more-save-more);
 * other types keep the Free Shipping callout.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const BMSM = ['yggdrasil-cloak-218', 'kitsune-ultra-cloak-1010', 'tokyo-ultra-cloak-1068'];
const FREESHIP = ['siren-hoodie-1420', 'kitsune-joggers-1653'];

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const check = async (handle, wantBmsm) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    try {
      await page.goto(`${BASE}/products/${handle}?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const s = await page.evaluate(() => ({
        type: window.ShopifyAnalytics?.meta?.product?.type,
        bmsm: document.querySelectorAll('.bmsm:not(.bmsm--freeship)').length,
        freeship: document.querySelectorAll('.bmsm--freeship').length,
        title: document.querySelector('.bmsm__title')?.textContent.trim(),
      }));
      if (wantBmsm) {
        assert.ok(s.bmsm === 1 && s.freeship === 0, `${handle} (${s.type}): bmsm=${s.bmsm} freeship=${s.freeship}`);
        assert.ok(/buy more/i.test(s.title || ''), `${handle}: title "${s.title}"`);
      } else {
        assert.ok(s.bmsm === 0 && s.freeship === 1, `${handle} (${s.type}): bmsm=${s.bmsm} freeship=${s.freeship}`);
      }
      console.log(`PASS ${handle} (${s.type}) -> ${wantBmsm ? `BMSM "${s.title}"` : 'Free Shipping'}`);
    } catch (e) { failed++; console.log(`FAIL ${e.message}`); } finally { await page.close(); }
  };
  for (const h of BMSM) await check(h, true);
  for (const h of FREESHIP) await check(h, false);
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
