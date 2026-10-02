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
      const cs = getComputedStyle(el);
      return {
        top: Math.round(b.top),
        bottom: Math.round(b.bottom),
        h: Math.round(b.height),
        mt: cs.marginTop,
        mb: cs.marginBottom,
      };
    };
    return {
      img: r('.product__media-item.is-active img'),
      thumbSlider: r('.thumbnail-slider'),
      mediaWrapper: r('.product__media-wrapper'),
      productInfo: r('.product__info-wrapper'),
      title: r('.product__title'),
      overlap: (() => {
        const img = document.querySelector('.product__media-item.is-active img');
        const thumb = document.querySelector('.thumbnail-slider');
        const info = document.querySelector('.product__info-wrapper');
        if (!img || !thumb || !info) return null;
        const ib = img.getBoundingClientRect();
        const tb = thumb.getBoundingClientRect();
        const infob = info.getBoundingClientRect();
        return {
          thumbOverlapsImg: tb.top < ib.bottom,
          thumbOverlapPx: Math.round(ib.bottom - tb.top),
          infoStartsBeforeThumbEnds: infob.top < tb.bottom,
          gapThumbToInfo: Math.round(infob.top - tb.bottom),
        };
      })(),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/_layout-bug-check.png', fullPage: true });
  await browser.close();
})();
