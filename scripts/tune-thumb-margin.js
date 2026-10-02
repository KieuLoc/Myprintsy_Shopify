const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  const base = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom) };
    };
    const img = document.querySelector('.product__media-item.is-active img');
    const ib = img?.getBoundingClientRect().bottom ?? 0;
    const thumb = document.querySelector('.thumbnail-slider');
    const tb = thumb?.getBoundingClientRect().top ?? 0;
    return { imgBottom: Math.round(ib), thumbTop: Math.round(tb), gap: Math.round(tb - ib) };
  });
  console.log('LIVE base', base);

  for (const mt of ['0', '-4rem', '-5rem', '-6rem', '-7rem', '-8rem']) {
    await page.evaluate((marginTop) => {
      let s = document.getElementById('_gap-test');
      if (!s) {
        s = document.createElement('style');
        s.id = '_gap-test';
        document.head.appendChild(s);
      }
      s.textContent = `@media(max-width:749px){
        product-info .product__media-wrapper .thumbnail-slider{margin-top:${marginTop}!important;}
      }`;
    }, mt);
    await page.waitForTimeout(200);
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
      };
    });
    console.log(mt, m);
  }
  await browser.close();
})();
