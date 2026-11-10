/**
 * Check: Cloak / Ultra Cloak / Hoodie 3D / Jogger / Bomber Jacket / Zip Hoodie / Hawaii Shirt / Socks / Legging / Bedding Set show the
 * Buy More, Save More box (like product.buy-more-save-more) with 10/15/20% tiers; other types show nothing.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const BMSM = ['yggdrasil-cloak-218', 'kitsune-ultra-cloak-1010', 'siren-hoodie-1420', 'kitsune-joggers-1653', 'ogham-bomber-jacket-926', 'dragon-luna-zip-hoodie-1150', 'hawaii-hawaiian-shirt-parrot', 'i-have-always-been-enough-personalized-full-print-squad-socks-gfthah1o13', 'ghost-oath-leggings', 'golden-boughs-3-piece-quilted-bedding-set-ncu0dv8472'];
const NONE = ['cyber-hooded-blanket-limited-649', 'pickleball-lover-personalized-mug-pklaah2a03'];

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const check = async (handle, want) => {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    try {
      await page.goto(`${BASE}/products/${handle}?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      const s = await page.evaluate(() => ({
        type: window.ShopifyAnalytics?.meta?.product?.type,
        bmsm: document.querySelectorAll('.bmsm:not(.bmsm--freeship)').length,
        freeship: document.querySelectorAll('.bmsm--freeship').length,
        title: document.querySelector('.bmsm__title')?.textContent.trim(),
        tiers: [...document.querySelectorAll('.bmsm__row')].map((r) => r.textContent.replace(/\s+/g, ' ').trim()).join(' | '),
      }));
      if (want === 'bmsm') {
        assert.ok(s.bmsm === 1 && s.freeship === 0, `${handle} (${s.type}): bmsm=${s.bmsm} freeship=${s.freeship}`);
        assert.ok(/buy more/i.test(s.title || ''), `${handle}: title "${s.title}"`);
        assert.ok(/Buy 2 Get 10%.*Buy 3 Get 15%.*Buy 4\+ Get 20%/.test(s.tiers), `${handle}: tiers "${s.tiers}"`);
      } else {
        assert.ok(s.bmsm === 0 && s.freeship === 0, `${handle} (${s.type}): expected nothing, bmsm=${s.bmsm} freeship=${s.freeship}`);
      }
      console.log(`PASS ${handle} (${s.type}) -> ${want === 'bmsm' ? `BMSM "${s.tiers}"` : 'nothing'}`);
    } catch (e) { failed++; console.log(`FAIL ${e.message}`); } finally { await page.close(); }
  };
  for (const h of BMSM) await check(h, 'bmsm');
  for (const h of NONE) await check(h, 'none');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
