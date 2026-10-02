/** Read Customily engraver template/option-set identity for a PDP. */
const { chromium } = require('playwright');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(20000);

  const info = await page.evaluate(() => {
    const eng = window.engraver || {};
    const optionSetEl = document.querySelector('[id^="cl-set-"]');
    const setId = optionSetEl ? (optionSetEl.id.match(/cl-set-([0-9a-f-]{36})/) || [])[1] : null;
    return {
      templateId: eng.currentProductId || (eng.currentProduct ? eng.currentProduct.id : null),
      templateName: eng.currentProduct ? eng.currentProduct.name || eng.currentProduct.title || null : null,
      currentProductKeys: eng.currentProduct ? Object.keys(eng.currentProduct).slice(0, 30) : null,
      previewCount: Array.isArray(eng.listPreviews) ? eng.listPreviews.length : null,
      sessionId: typeof eng.getSessionId === 'function' ? eng.getSessionId() : null,
      optionSetId: setId,
      shop: window.Shopify ? window.Shopify.shop : null,
      engraverKeys: Object.keys(eng).slice(0, 25),
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
