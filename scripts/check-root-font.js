const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);
  const data = await page.evaluate(() => {
    const html = getComputedStyle(document.documentElement).fontSize;
    const img = document.querySelector('.product__media-item.is-active img');
    const ts = document.querySelector('.thumbnail-slider');
    return {
      rootFontSize: html,
      imgRect: img ? img.getBoundingClientRect() : null,
      thumbTop: ts ? ts.getBoundingClientRect().top : null,
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
