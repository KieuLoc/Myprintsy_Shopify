const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

  for (const sec of [8, 12, 18]) {
    await page.waitForTimeout(sec === 8 ? 8000 : 4000);
    const data = await page.evaluate((waitSec) => {
      const r = (el) => (el ? el.getBoundingClientRect() : null);
      const img = document.querySelector('.product__media-item.is-active img');
      const canvas = document.querySelector('.cl-canvas-container');
      const ml = document.querySelector('.product__media-list');
      const ts = document.querySelector('.thumbnail-slider');
      const visual = canvas || img;
      return {
        waitSec,
        hasCanvas: !!canvas,
        visualBottom: visual ? Math.round(visual.getBoundingClientRect().bottom) : null,
        mlBottom: ml ? Math.round(ml.getBoundingClientRect().bottom) : null,
        tsTop: ts ? Math.round(ts.getBoundingClientRect().top) : null,
        gapMlToThumb: ml && ts ? Math.round(ts.getBoundingClientRect().top - ml.getBoundingClientRect().bottom) : null,
        gapVisualToThumb: visual && ts ? Math.round(ts.getBoundingClientRect().top - visual.getBoundingClientRect().bottom) : null,
        mlMb: ml ? getComputedStyle(ml).marginBottom : null,
      };
    }, sec);
    console.log(JSON.stringify(data));
  }

  await browser.close();
})();
