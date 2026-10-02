const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    'https://www.myprintsy.com/products/study-dream-achieve-personalized-tumbler-cup-scthth1l14',
    { waitUntil: 'load', timeout: 120000 }
  );
  await page.waitForTimeout(8000);

  const styles = await page.evaluate(() => {
    return [...document.querySelectorAll('style')].map((el, i) => ({
      i,
      id: el.id || null,
      len: el.textContent.length,
      snippet: el.textContent.includes('product__info-wrapper')
        ? el.textContent.slice(
            Math.max(0, el.textContent.indexOf('product__info-wrapper') - 120),
            el.textContent.indexOf('product__info-wrapper') + 220
          )
        : null,
    }));
  });

  console.log(JSON.stringify(styles.filter((s) => s.snippet), null, 2));
  await browser.close();
})();
