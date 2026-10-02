const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);

  const data = await page.evaluate(() => {
    const rules = [];
    for (const sheet of document.styleSheets) {
      let cssRules;
      try {
        cssRules = sheet.cssRules;
      } catch {
        continue;
      }
      for (const rule of cssRules) {
        const t = rule.cssText || '';
        if (/cl-canvas|slider--mobile|thumbnail-slider|product__media|GalleryViewer/i.test(t)) {
          rules.push(t);
        }
      }
    }
    const inline = [...document.querySelectorAll('style')]
      .map((s) => s.textContent || '')
      .filter((t) => /cl-canvas|slider--mobile|thumbnail|product__media/i.test(t));

    const wrap = document.querySelector('product-info .product__media-wrapper');
    const els = wrap
      ? [
          '.product__media-item.is-active',
          '.product__media-item.is-active img',
          '.product-media-container',
          '.product__modal-opener',
          '.cl-canvas-container',
          '[id^="GalleryViewer"]',
          '.product__media-list',
          'slider-component:not(.thumbnail-slider)',
          '.thumbnail-slider',
        ].map((sel) => {
          const el = wrap.querySelector(sel);
          if (!el) return { sel, missing: true };
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return {
            sel,
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            h: Math.round(r.height),
            mb: cs.marginBottom,
            mt: cs.marginTop,
            pb: cs.paddingBottom,
            pt: cs.paddingTop,
            minH: cs.minHeight,
          };
        })
      : [];

    return { rules: rules.slice(0, 30), inline, els };
  });

  console.log('ELEMENTS', JSON.stringify(data.els, null, 2));
  console.log('\nINLINE STYLES', data.inline.join('\n---\n'));
  console.log('\nCSS RULES COUNT', data.rules.length);
  data.rules.forEach((r) => console.log(r));

  await browser.close();
})();
