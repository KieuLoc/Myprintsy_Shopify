const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';
(async () => {
  const browser = await chromium.launch({ headless: true });
  for (const vp of [
    { w: 390, h: 844, name: 'mobile' },
    { w: 1280, h: 900, name: 'desktop' },
  ]) {
    const page = await browser.newPage({ viewport: { width: vp.w, height: vp.h } });
    await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
    await page.waitForTimeout(8000);
    const data = await page.evaluate((name) => {
      const r = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height) };
      };
      const img = document.querySelector('.product__media-item.is-active img');
      const thumb = document.querySelector('.thumbnail-slider');
      const info = document.querySelector('.product__info-wrapper');
      const thumbCs = thumb ? getComputedStyle(thumb).marginTop : null;
      return {
        name,
        img: r('.product__media-item.is-active img'),
        thumb: r('.thumbnail-slider'),
        info: r('.product__info-wrapper'),
        title: r('.product__title'),
        thumbMt: thumbCs,
        gapImgToThumb: img && thumb ? Math.round(thumb.getBoundingClientRect().top - img.getBoundingClientRect().bottom) : null,
        gapThumbToInfo: thumb && info ? Math.round(info.getBoundingClientRect().top - thumb.getBoundingClientRect().bottom) : null,
      };
    }, vp.name);
    console.log(JSON.stringify(data));
    await page.screenshot({ path: `scripts/_layout-${vp.name}.png` });
    await page.close();
  }
  await browser.close();
})();
