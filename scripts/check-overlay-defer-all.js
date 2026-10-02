const { chromium } = require('playwright');

const URL =
  'https://myprintsy-3.myshopify.com/products/creep-it-real-personalized-accent-mug-gift-for-halloween-hwth1l30?preview_theme_id=186878558524';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const imgs = [];
  page.on('request', (req) => {
    if (req.resourceType() === 'image') imgs.push(req.url());
  });

  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  const info = await page.evaluate(() => {
    const deferred = document.querySelectorAll('img[data-myprintsy-defer-src]');
    const armed = document.querySelectorAll('img[data-myprintsy-defer-armed="1"]');
    const withSrc = Array.from(deferred).filter((img) => img.getAttribute('src'));
    return {
      deferredCount: deferred.length,
      armedCount: armed.length,
      deferredWithSrc: withSrc.length,
      deferBgCount: document.querySelectorAll('[data-myprintsy-defer-bg]').length,
    };
  });

  const overlayHits = imgs.filter((u) =>
    /1_01\.png|866e1f9d-35ae-438c-9a08-bd8d1f5b317f|05e9476c-3899-47b7-bea0-404bb23290c6|1_01_aae37eb9/i.test(u)
  );

  console.log(JSON.stringify({ info, overlayHits, totalImages: imgs.length }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
