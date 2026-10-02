const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    'https://www.myprintsy.com/products/study-dream-achieve-personalized-tumbler-cup-scthth1l14',
    { waitUntil: 'load', timeout: 120000 }
  );

  let elapsed = 0;
  for (const step of [0, 8000, 7000, 10000]) {
    if (step) await page.waitForTimeout(step);
    elapsed += step;
    const snap = await page.evaluate((elapsed) => {
      const title = document.querySelector('.product__info-container .product__title');
      const thumb = document.querySelector('.thumbnail-list');
      return {
        elapsed,
        titleMt: title ? getComputedStyle(title).marginTop : null,
        gap:
          title && thumb
            ? Math.round(title.getBoundingClientRect().top - thumb.getBoundingClientRect().bottom)
            : null,
      };
    }, elapsed);
    console.log(JSON.stringify(snap));
  }

  await browser.close();
})();
