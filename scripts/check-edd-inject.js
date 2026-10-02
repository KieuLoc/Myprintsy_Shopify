const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Intercept EDD scripts to find injection selector
  const eddTexts = [];
  page.on('response', async (res) => {
    const u = res.url();
    if (/estimated-delivery-days|edd_metafields|setubridge/i.test(u) && /\.js(\?|$)/.test(u)) {
      try {
        const t = await res.text();
        eddTexts.push({ url: u.slice(0, 120), len: t.length, t });
      } catch (e) {}
    }
  });

  await page.goto(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16',
    { waitUntil: 'domcontentloaded', timeout: 90000 }
  );
  await page.waitForTimeout(12000);

  const hits = [];
  for (const s of eddTexts) {
    const patterns = [
      'custom_delivery_estimation_widget',
      'sb_ETA',
      'querySelector',
      'insertAdjacent',
      'appendChild',
      'detail_page_class',
      'deliverydate',
    ];
    const found = {};
    for (const p of patterns) {
      const idx = s.t.indexOf(p);
      found[p] = idx;
      if (idx >= 0) {
        found[p + '_ctx'] = s.t.slice(Math.max(0, idx - 80), idx + 120).replace(/\s+/g, ' ');
      }
    }
    hits.push({ url: s.url, len: s.len, found });
  }

  // Also dump collection msg store_locatore / countries for plate
  const runtime = await page.evaluate(() => {
    const msgs = window.sb_edd_collection_msg || [];
    return {
      collectionMsgs: msgs.map((m) => ({
        countries: m.countries || m.country || m.store_locatore_list,
        is_instock: m.is_instock,
        preview: (m.message || '').replace(/<[^>]+>/g, ' ').slice(0, 80),
        collections: m.collection_list || m.collections,
      })),
      allMsgs: (window.sb_edd_all_product_msg || []).slice?.(0, 3),
      specific: window.sb_edd_specific_product_msg,
      tagMsgs: window.sb_edd_product_tag_msg,
      findType: typeof window.findSpecificEDDMsg,
      findResult: (function () {
        try {
          const r = window.findSpecificEDDMsg && window.findSpecificEDDMsg();
          if (r == null) return null;
          if (typeof r === 'string') return r.slice(0, 200);
          if (r.message) return String(r.message).slice(0, 200);
          return Object.keys(r);
        } catch (e) {
          return 'ERR ' + e.message;
        }
      })(),
    };
  });

  console.log(JSON.stringify({ hits, runtime }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
