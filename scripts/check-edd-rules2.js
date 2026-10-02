const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let eddMain = '';
  page.on('response', async (res) => {
    if (/edd_metafields_extension\.js/i.test(res.url())) {
      try {
        eddMain = await res.text();
      } catch (e) {}
    }
  });
  await page.goto(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16',
    { waitUntil: 'domcontentloaded', timeout: 90000 }
  );
  await page.waitForTimeout(8000);

  const data = await page.evaluate(() => {
    const msgs = window.sb_edd_collection_msg || [];
    return {
      cols: window.edd_sb_collection_id,
      checkCol: window.edd_check_sb_collection_id,
      deliveryMessageBefore: typeof deliveryMessageBefore !== 'undefined' ? deliveryMessageBefore : 'UNDEF',
      detail_page_class: window.sb_edd_options && window.sb_edd_options.detail_page_class,
      hasEta: !!document.querySelector('.sb_ETA'),
      rules: msgs.map((m, i) => ({
        i,
        check_rule_for: m.check_rule_for,
        country_code: m.country_code,
        country_state: m.country_state,
        is_enable: m.is_enable,
        shipping_enable: m.shipping_enable,
        location_enable: m.location_enable,
      })),
    };
  });
  console.log(JSON.stringify(data, null, 2));

  const chunks = [];
  let pos = 0;
  let n = 0;
  while ((pos = eddMain.indexOf('deliveryMessageBefore =', pos)) >= 0 && n < 20) {
    chunks.push('ASSIGN@' + pos + '\n' + eddMain.slice(pos, pos + 500));
    pos += 20;
    n++;
  }
  pos = 0;
  n = 0;
  while ((pos = eddMain.indexOf('detail_page_class', pos)) >= 0 && n < 12) {
    chunks.push('DETAIL@' + pos + '\n' + eddMain.slice(pos, pos + 700));
    pos += 20;
    n++;
  }
  fs.writeFileSync('scripts/edd-inject-logic.txt', chunks.join('\n\n====\n\n'));
  console.log('wrote edd-inject-logic.txt', chunks.length);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
