const { chromium } = require('playwright');

async function probe(page, url, label) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  const data = await page.evaluate(() => {
    const eta = document.querySelector('.sb_ETA');
    let msg = null;
    try {
      if (typeof window.findSpecificEDDMsg === 'function') {
        msg = window.findSpecificEDDMsg();
      }
    } catch (e) {
      msg = 'err:' + e.message;
    }
    return {
      handle: window.edd_sb_product_handle,
      id: window.edd_sb_product_id,
      exclude: window.edd_exclude_product,
      available: window.sb_product_avaiable,
      tags: window.edd_sb_product_tag,
      collections: window.edd_sb_collection_id,
      options: window.sb_edd_options,
      plan: window.sb_edd_plan_info,
      locationSet: window.sb_eta_set_for_location,
      country: window.edd_user_country_code,
      allMsgCount: Array.isArray(window.sb_edd_all_product_msg) ? window.sb_edd_all_product_msg.length : null,
      collectionMsgCount: Array.isArray(window.sb_edd_collection_msg)
        ? window.sb_edd_collection_msg.length
        : null,
      specificMsgCount: Array.isArray(window.sb_edd_specific_product_msg)
        ? window.sb_edd_specific_product_msg.length
        : null,
      hasEta: !!eta,
      delivered: document.body.innerText.includes('Delivered to'),
      slotCount: document.querySelectorAll('.custom_delivery_estimation_widget').length,
      msgPreview: typeof msg === 'string' ? msg.slice(0, 200) : msg,
      // try to see if app expects a selector
      bodyScripts: [...document.querySelectorAll('script')]
        .map((s) => s.src)
        .filter((s) => /edd|estimated-delivery|setubridge/i.test(s)),
    };
  });
  console.log('==== ' + label + ' ====');
  console.log(JSON.stringify(data, null, 2));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await probe(
    page,
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16',
    'PLATE'
  );
  await probe(
    page,
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13',
    'MUG'
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
