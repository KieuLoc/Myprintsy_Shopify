const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

  const measure = (label) =>
    page.evaluate((label) => {
      const pick = (sel) => document.querySelector(sel);
      const r = (el) => (el ? el.getBoundingClientRect() : null);
      const thumb = pick('.thumbnail-slider');
      const targets = [
        ['img', pick('.product__media-item.is-active img')],
        ['container', pick('.product__media-item.is-active .product-media-container')],
        ['modalOpener', pick('.product__media-item.is-active .product__modal-opener')],
        ['activeItem', pick('.product__media-item.is-active')],
        ['viewer', pick('[id^="GalleryViewer"]')],
        ['mediaWrapper', pick('.product__media-wrapper')],
      ].filter(([, el]) => el);

      const thumbTop = thumb ? Math.round(r(thumb).top) : null;
      const rows = targets.map(([name, el]) => {
        const rect = r(el);
        return {
          name,
          bottom: Math.round(rect.bottom),
          h: Math.round(rect.height),
          gapToThumb: thumbTop !== null ? thumbTop - Math.round(rect.bottom) : null,
          mb: getComputedStyle(el).marginBottom,
          pb: getComputedStyle(el).paddingBottom,
        };
      });
      return { label, thumbTop, rows };
    }, label);

  // Remove our pin so we see "natural" post-customily gap
  await page.evaluate(() => {
    document.getElementById('myprintsy-pdp-gallery-spacing')?.remove();
  });

  await page.waitForTimeout(12000);
  console.log(JSON.stringify(await measure('no-pin@12s'), null, 2));

  // Re-add pin with different margins for comparison
  for (const mt of ['0', '-0.3rem', '-0.6rem', '-1rem', '-1.5rem']) {
    await page.evaluate((mt) => {
      let s = document.getElementById('test-gap');
      if (!s) {
        s = document.createElement('style');
        s.id = 'test-gap';
        document.head.appendChild(s);
      }
      s.textContent = `@media(max-width:749px){product-info .product__media-wrapper .thumbnail-slider{margin-top:${mt}!important;}}`;
    }, mt);
    await page.waitForTimeout(100);
    const m = await measure('mt=' + mt);
    console.log(
      mt,
      'gaps:',
      m.rows.map((x) => `${x.name}:${x.gapToThumb}`).join(', ')
    );
  }

  await browser.close();
})();
