const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
const cssPath = path.join(__dirname, '../assets/section-main-product.css');

(async () => {
  let css = fs.readFileSync(cssPath, 'utf8');
  // Simulate fix: remove -11rem, add crop
  css = css.replace(
    /product-info \.product__media-wrapper \.thumbnail-slider \{\s*margin-top: -11rem !important;\s*\}/,
    `product-info .product__media-wrapper .product-media-container.constrain-height .media {
    padding-top: min(34rem, var(--ratio-percent)) !important;
  }`
  );

  const browser = await chromium.launch({ headless: true });
  for (const vp of [
    { w: 390, h: 844, name: 'mobile' },
    { w: 1280, h: 900, name: 'desktop' },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.route('**/*section-main-product.css*', (route) =>
      route.fulfill({ status: 200, contentType: 'text/css', body: css })
    );
    await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(8000);
    const m = await page.evaluate(() => {
      const img = document.querySelector('.product__media-item.is-active img');
      const thumb = document.querySelector('.thumbnail-slider');
      const title = document.querySelector('.product__title');
      const ib = img.getBoundingClientRect().bottom;
      const tt = thumb.getBoundingClientRect().top;
      const tb = thumb.getBoundingClientRect().bottom;
      const tit = title.getBoundingClientRect().top;
      return {
        gapImgThumb: Math.round(tt - ib),
        gapThumbTitle: Math.round(tit - tb),
        imgH: Math.round(img.getBoundingClientRect().height),
        thumbMt: getComputedStyle(thumb).marginTop,
      };
    });
    console.log(vp.name, m);
    await page.screenshot({ path: `scripts/_fixed-${vp.name}.png` });
    await page.close();
  }
  await browser.close();
})();
