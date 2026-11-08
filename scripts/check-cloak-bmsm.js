/**
 * Check: Cloak / Ultra Cloak / Hoodie 3D / Jogger / Bomber Jacket / Zip Hoodie / Hawaii Shirt / Socks / Legging show the Buy More, Save More box
 * (like product.buy-more-save-more); Bedding Set shows Free Shipping From $139; other types show nothing.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const BMSM = ['yggdrasil-cloak-218', 'kitsune-ultra-cloak-1010', 'siren-hoodie-1420', 'kitsune-joggers-1653', 'ogham-bomber-jacket-926', 'dragon-luna-zip-hoodie-1150', 'hawaii-hawaiian-shirt-parrot', 'i-have-always-been-enough-personalized-full-print-squad-socks-gfthah1o13', 'ghost-oath-leggings'];
const FREESHIP = ['golden-boughs-3-piece-quilted-bedding-set-ncu0dv8472'];
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
        msg: document.querySelector('.bmsm--freeship .bmsm__msg')?.textContent.replace(/\s+/g, ' ').trim(),
      }));
      if (want === 'bmsm') {
        assert.ok(s.bmsm === 1 && s.freeship === 0, `${handle} (${s.type}): bmsm=${s.bmsm} freeship=${s.freeship}`);
        assert.ok(/buy more/i.test(s.title || ''), `${handle}: title "${s.title}"`);
      } else if (want === 'freeship') {
        assert.ok(s.bmsm === 0 && s.freeship === 1, `${handle} (${s.type}): bmsm=${s.bmsm} freeship=${s.freeship}`);
        assert.ok(/\$139/.test(s.msg || ''), `${handle}: freeship text "${s.msg}"`);
      } else {
        assert.ok(s.bmsm === 0 && s.freeship === 0, `${handle} (${s.type}): expected nothing, bmsm=${s.bmsm} freeship=${s.freeship}`);
      }
      console.log(`PASS ${handle} (${s.type}) -> ${want === 'bmsm' ? `BMSM "${s.title}"` : want === 'freeship' ? `"${s.msg}"` : 'nothing'}`);
    } catch (e) { failed++; console.log(`FAIL ${e.message}`); } finally { await page.close(); }
  };
  for (const h of BMSM) await check(h, 'bmsm');
  for (const h of FREESHIP) await check(h, 'freeship');
  for (const h of NONE) await check(h, 'none');
  await browser.close();
  process.exit(failed ? 1 : 0);
})();
