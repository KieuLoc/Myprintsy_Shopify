const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);

  const data = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const box = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        top: Math.round(box.top),
        bottom: Math.round(box.bottom),
        h: Math.round(box.height),
        mb: cs.marginBottom,
        mt: cs.marginTop,
        pb: cs.paddingBottom,
        pt: cs.paddingTop,
      };
    };
    return {
      activeItem: pick('.product__media-item.is-active'),
      mediaContainer: pick('.product__media-item.is-active .product-media-container'),
      media: pick('.product__media-item.is-active .media'),
      img: pick('.product__media-item.is-active img'),
      canvas: pick('.product__media-item.is-active .cl-canvas-container'),
      canvasImg: pick('.product__media-item.is-active .cl-canvas-container img'),
      mediaList: pick('.product__media-list'),
      thumbSlider: pick('.thumbnail-slider'),
      thumbList: pick('.thumbnail-list'),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/_gap-check2.png', fullPage: false });
  await browser.close();
})();
