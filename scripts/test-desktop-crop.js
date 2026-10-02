const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
let css = fs.readFileSync(path.join(__dirname, '../assets/section-main-product.css'), 'utf8');
css = css.replace(
  /product-info \.product__media-wrapper \.thumbnail-slider \{\s*margin-top: -11rem !important;\s*\}/,
  `product-info .product__media-wrapper .product-media-container.constrain-height .media {
    padding-top: min(34rem, var(--ratio-percent)) !important;
  }`
);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.route('**/*section-main-product.css*', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css', body: css })
  );
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  for (const rem of [null, 48, 50, 52]) {
    if (rem) {
      await page.evaluate((r) => {
        document.getElementById('_d')?.remove();
        const s = document.createElement('style');
        s.id = '_d';
        s.textContent = `@media(min-width:750px){product-info .product__media-wrapper .product-media-container.constrain-height .media{padding-top:min(${r}rem,var(--ratio-percent))!important;}}`;
        document.head.appendChild(s);
      }, rem);
      await page.waitForTimeout(200);
    }
    const m = await page.evaluate(() => {
      const img = document.querySelector('.product__media-item.is-active img');
      const thumb = document.querySelector('.thumbnail-slider');
      return {
        gap: Math.round(thumb.getBoundingClientRect().top - img.getBoundingClientRect().bottom),
        imgH: Math.round(img.getBoundingClientRect().height),
      };
    });
    console.log(rem ?? 'baseline-desktop', m);
  }
  await browser.close();
})();
