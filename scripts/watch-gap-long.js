const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

  const snap = () =>
    page.evaluate(() => {
      const wrap = document.querySelector('product-info .product__media-wrapper');
      const img = wrap?.querySelector('.product__media-item.is-active img');
      const thumb = wrap?.querySelector('.thumbnail-slider');
      const viewer = wrap?.querySelector('[id^="GalleryViewer"]');
      const canvas = wrap?.querySelector('.cl-canvas-container');
      const active = wrap?.querySelector('.product__media-item.is-active');
      const r = (el) => (el ? el.getBoundingClientRect() : null);
      const cs = (el) => (el ? getComputedStyle(el) : null);

      const customilyStyles = [...document.querySelectorAll('style')]
        .filter((s) => (s.textContent || '').includes('cl-canvas'))
        .map((s) => s.textContent.slice(0, 200));

      return {
        gapImg: img && thumb ? Math.round(r(thumb).top - r(img).bottom) : null,
        gapViewer: viewer && thumb ? Math.round(r(thumb).top - r(viewer).bottom) : null,
        gapActive: active && thumb ? Math.round(r(thumb).top - r(active).bottom) : null,
        imgH: img ? Math.round(r(img).height) : null,
        activeH: active ? Math.round(r(active).height) : null,
        viewerH: viewer ? Math.round(r(viewer).height) : null,
        wrapH: wrap ? Math.round(r(wrap).height) : null,
        thumbMt: thumb ? cs(thumb).marginTop : null,
        listMb: wrap?.querySelector('.product__media-list')
          ? cs(wrap.querySelector('.product__media-list')).marginBottom
          : null,
        hasPin: !!document.getElementById('myprintsy-pdp-gallery-spacing'),
        canvasH: canvas ? Math.round(r(canvas).height) : null,
        canvasTop: canvas ? cs(canvas).top : null,
        customilyStyleCount: customilyStyles.length,
      };
    });

  for (const t of [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30]) {
    if (t) await page.waitForTimeout((t - (t === 1 ? 0 : [0,1,2,3,4,5,6,7,8,9,10,12,15,20,25,30][[0,1,2,3,4,5,6,7,8,9,10,12,15,20,25,30].indexOf(t)-1])) * 1000);
  }

  // simpler loop
  await browser.close();
})();

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

  const snap = () =>
    page.evaluate(() => {
      const wrap = document.querySelector('product-info .product__media-wrapper');
      const img = wrap?.querySelector('.product__media-item.is-active img');
      const thumb = wrap?.querySelector('.thumbnail-slider');
      const viewer = wrap?.querySelector('[id^="GalleryViewer"]');
      const canvas = wrap?.querySelector('.cl-canvas-container');
      const active = wrap?.querySelector('.product__media-item.is-active');
      const r = (el) => (el ? el.getBoundingClientRect() : null);
      const cs = (el) => (el ? getComputedStyle(el) : null);
      return {
        gapImg: img && thumb ? Math.round(r(thumb).top - r(img).bottom) : null,
        gapViewer: viewer && thumb ? Math.round(r(thumb).top - r(viewer).bottom) : null,
        imgH: img ? Math.round(r(img).height) : null,
        activeH: active ? Math.round(r(active).height) : null,
        thumbMt: thumb ? cs(thumb).marginTop : null,
        listMb: wrap?.querySelector('.product__media-list')
          ? cs(wrap.querySelector('.product__media-list')).marginBottom
          : null,
        hasPin: !!document.getElementById('myprintsy-pdp-gallery-spacing'),
        pinText: document.getElementById('myprintsy-pdp-gallery-spacing')?.textContent || '',
        customilyRules: [...document.querySelectorAll('style')]
          .map((s) => s.textContent || '')
          .filter((t) => /cl-canvas|thumbnail|product__media|slider--mobile/i.test(t))
          .length,
      };
    });

  const times = [0, 500, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 12000, 15000, 20000, 25000, 30000];
  let elapsed = 0;
  for (const t of times) {
    if (t > elapsed) await page.waitForTimeout(t - elapsed);
    elapsed = t;
    const m = await snap();
    console.log(`${(t / 1000).toFixed(1)}s`, JSON.stringify(m));
  }

  await page.screenshot({ path: 'scripts/_gap-final-30s.png' });
  await browser.close();
})();
