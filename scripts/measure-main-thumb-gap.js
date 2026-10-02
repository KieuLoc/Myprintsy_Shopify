const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(10000);

  const data = await page.evaluate(() => {
    const rects = [];
    const push = (sel, label) => {
      document.querySelectorAll(sel).forEach((el, i) => {
        const r = el.getBoundingClientRect();
        if (r.height < 1 && r.width < 1) return;
        rects.push({
          label: label + (document.querySelectorAll(sel).length > 1 ? `#${i}` : ''),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
          h: Math.round(r.height),
          mb: getComputedStyle(el).marginBottom,
          mt: getComputedStyle(el).marginTop,
          pb: getComputedStyle(el).paddingBottom,
          pt: getComputedStyle(el).paddingTop,
        });
      });
    };

    push('.product__media-item.is-active img', 'img');
    push('.product__media-item.is-active', 'activeItem');
    push('.product-media-container', 'mediaContainer');
    push('.product__media-list', 'mediaList');
    push('#GalleryViewer-template--25830739673404__main', 'galleryViewer');
    push('.thumbnail-slider', 'thumbSlider');
    push('.thumbnail-list', 'thumbList');
    push('.product__media-item.is-active .cl-canvas-container', 'canvas');

    rects.sort((a, b) => a.top - b.top);
    return rects;
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/_gap-check.png' });
  await browser.close();
})();
