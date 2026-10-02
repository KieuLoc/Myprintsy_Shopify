const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  const measure = () =>
    page.evaluate(() => {
      const r = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          top: Math.round(b.top),
          bottom: Math.round(b.bottom),
          h: Math.round(b.height),
          mt: cs.marginTop,
          mb: cs.marginBottom,
        };
      };
      const img = document.querySelector('.product__media-item.is-active img');
      const ib = img ? Math.round(img.getBoundingClientRect().bottom) : null;
      const tt = document.querySelector('.thumbnail-slider');
      const ttb = tt ? Math.round(tt.getBoundingClientRect().top) : null;
      return {
        imgBottom: ib,
        thumbTop: ttb,
        gap: ttb - ib,
        mediaWrapper: r('.product__media-wrapper'),
        mediaGallery: r('media-gallery'),
        mediaList: r('.product__media-list'),
        thumb: r('.thumbnail-slider'),
        info: r('.product__info-wrapper'),
        title: r('.product__title'),
      };
    });

  console.log('BEFORE', await measure());

  await page.addStyleTag({
    content: `@media(max-width:749px){
      product-info .product__media-wrapper .thumbnail-slider{margin-top:0!important;}
    }`,
  });
  await page.waitForTimeout(300);
  console.log('AFTER mt:0', await measure());

  await page.evaluate(() => {
    document.getElementById('gap-test2')?.remove();
    const s = document.createElement('style');
    s.id = 'gap-test2';
    s.textContent = `@media(max-width:749px){
      product-info .product__media-wrapper .thumbnail-slider{margin-top:-5rem!important;}
    }`;
    document.head.appendChild(s);
  });
  await page.waitForTimeout(300);
  console.log('AFTER mt:-5rem', await measure());

  await page.screenshot({ path: 'scripts/_mobile-mt0.png' });
  await browser.close();
})();
