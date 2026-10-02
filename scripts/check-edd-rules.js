const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  let eddMain = '';
  page.on('response', async (res) => {
    const u = res.url();
    if (/edd_metafields_extension\.js/i.test(u)) {
      try {
        eddMain = await res.text();
      } catch (e) {}
    }
  });

  async function dump(url, label) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(8000);
    const data = await page.evaluate(() => {
      const msgs = window.sb_edd_collection_msg;
      return {
        productId: window.edd_sb_product_id,
        collections: window.edd_sb_collection_id,
        tags: window.edd_sb_product_tag,
        checkCollections: window.edd_check_sb_collection_id,
        find: (function () {
          try {
            return window.findSpecificEDDMsg();
          } catch (e) {
            return 'ERR:' + e.message;
          }
        })(),
        msgs: Array.isArray(msgs)
          ? msgs.map((m, i) => ({
              i,
              keys: Object.keys(m),
              store_locatore_list: m.store_locatore_list,
              is_instock: m.is_instock,
              is_continue_selling: m.is_continue_selling,
              collection: m.collection || m.collections || m.collection_list || m.collection_id,
              product_list: m.product_list,
              tag: m.tag || m.product_tag,
              vendor: m.vendor,
              messagePreview: String(m.message || '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/\s+/g, ' ')
                .slice(0, 100),
            }))
          : msgs,
      };
    });
    console.log('==== ' + label + ' ====');
    console.log(JSON.stringify(data, null, 2));
  }

  await dump(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16',
    'PLATE'
  );
  await dump(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13',
    'MUG'
  );

  if (eddMain) {
    const idx = eddMain.indexOf('function findSpecificEDDMsg');
    const idx2 = eddMain.indexOf('findSpecificEDDMsg');
    const start = idx >= 0 ? idx : idx2;
    const snippet = eddMain.slice(start, start + 2500);
    fs.writeFileSync('scripts/edd-findSpecific.txt', snippet);
    console.log('saved findSpecific snippet, start=', start);

    // also deliveryMessageBefore
    const dIdx = eddMain.indexOf('deliveryMessageBefore');
    fs.writeFileSync(
      'scripts/edd-deliveryMessageBefore.txt',
      eddMain.slice(Math.max(0, dIdx - 500), dIdx + 2000)
    );

    const cIdx = eddMain.indexOf('custom_delivery');
    console.log('custom_delivery idx', cIdx);
    if (cIdx >= 0) {
      fs.writeFileSync('scripts/edd-custom-delivery.txt', eddMain.slice(cIdx - 200, cIdx + 800));
    }

    // detail_page_class usage
    let pos = 0;
    const detailHits = [];
    while ((pos = eddMain.indexOf('detail_page_class', pos)) >= 0 && detailHits.length < 8) {
      detailHits.push(eddMain.slice(pos, pos + 300).replace(/\s+/g, ' '));
      pos += 20;
    }
    fs.writeFileSync('scripts/edd-detail-page-class.txt', detailHits.join('\n---\n'));
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
