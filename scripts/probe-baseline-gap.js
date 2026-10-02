const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Strip our gallery spacing from live CSS files
  await page.route('**/*section-main-product.css*', async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    body = body.replace(
      /\/\* Customily load sau[\s\S]*?product-info \.product__media-wrapper \.slider--mobile \.cl-canvas-container \{[\s\S]*?\}\s*/m,
      ''
    );
    await route.fulfill({ response: resp, body });
  });

  await page.route('**/*customily-preview-atc.js*', async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    body = body.replace(/function ensureMobileGallerySpacingStyle\(\)[\s\S]*?\n  \}/m, 'function ensureMobileGallerySpacingStyle(){}');
    await route.fulfill({ response: resp, body });
  });

  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

  const snap = async (label) => {
    const data = await page.evaluate(() => {
      const img = document.querySelector('.product__media-item.is-active img');
      const thumb = document.querySelector('.thumbnail-slider');
      const list = document.querySelector('.product__media-list');
      const viewer = document.querySelector('[id^="GalleryViewer"]');
      const r = (el) => (el ? el.getBoundingClientRect() : null);
      const cs = (el) => (el ? getComputedStyle(el) : null);
      return {
        gap: Math.round(r(thumb).top - r(img).bottom),
        listMb: cs(list).marginBottom,
        thumbMt: cs(thumb).marginTop,
        viewerMb: cs(viewer).marginBottom,
        imgH: Math.round(r(img).height),
      };
    });
    console.log(label, data);
  };

  await snap('0.5s');
  await page.waitForTimeout(1500);
  await snap('2s');
  await page.waitForTimeout(8000);
  await snap('10s');
  await page.waitForTimeout(10000);
  await snap('20s');

  await browser.close();
})();
