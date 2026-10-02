const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);
  const data = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
    };
    return {
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      viewer: r('#GalleryViewer-template--25830739673404__main') || r('[id^="GalleryViewer"]'),
      mediaList: r('.product__media-list'),
      sliderButtons: r('.product__media-wrapper .slider-buttons'),
      thumbSlider: r('.thumbnail-slider'),
      img: r('.product__media-item.is-active img'),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
