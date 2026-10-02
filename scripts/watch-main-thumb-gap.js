const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });

  const measure = () =>
    page.evaluate(() => {
      const img =
        document.querySelector('.product__media-item.is-active img') ||
        document.querySelector('.product__media-item img');
      const thumb = document.querySelector('.thumbnail-slider');
      const mediaList = document.querySelector('.product__media-list');
      const canvas = document.querySelector('.cl-canvas-container');
      const activeItem = document.querySelector('.product__media-item.is-active');
      const viewer = document.querySelector('[id^="GalleryViewer"]');

      const r = (el) => (el ? el.getBoundingClientRect() : null);
      const cs = (el) => (el ? getComputedStyle(el) : null);

      const imgR = r(img);
      const thumbR = r(thumb);
      const gapImg = imgR && thumbR ? Math.round(thumbR.top - imgR.bottom) : null;
      const gapActive =
        activeItem && thumbR
          ? Math.round(thumbR.top - r(activeItem).bottom)
          : null;
      const gapViewer =
        viewer && thumbR ? Math.round(thumbR.top - r(viewer).bottom) : null;

      return {
        gapImg,
        gapActive,
        gapViewer,
        hasCanvas: !!canvas,
        hasGalleryPin: !!document.getElementById('myprintsy-pdp-gallery-spacing'),
        img: imgR ? { bottom: Math.round(imgR.bottom), h: Math.round(imgR.height) } : null,
        activeItem: activeItem
          ? {
              bottom: Math.round(r(activeItem).bottom),
              pb: cs(activeItem).paddingBottom,
              mb: cs(activeItem).marginBottom,
              h: Math.round(r(activeItem).height),
            }
          : null,
        viewer: viewer
          ? {
              bottom: Math.round(r(viewer).bottom),
              mb: cs(viewer).marginBottom,
              pb: cs(viewer).paddingBottom,
            }
          : null,
        mediaList: mediaList
          ? { mb: cs(mediaList).marginBottom, pb: cs(mediaList).paddingBottom }
          : null,
        thumb: thumbR
          ? { top: Math.round(thumbR.top), mt: cs(thumb).marginTop }
          : null,
        canvas: canvas
          ? {
              bottom: Math.round(r(canvas).bottom),
              top: cs(canvas).top,
              mb: cs(canvas).marginBottom,
              h: Math.round(r(canvas).height),
            }
          : null,
      };
    });

  const times = [0, 500, 1000, 2000, 3000, 5000, 8000, 10000, 12000, 15000, 20000];
  let elapsed = 0;
  for (const t of times) {
    if (t > elapsed) await page.waitForTimeout(t - elapsed);
    elapsed = t;
    const m = await measure();
    console.log(`${(t / 1000).toFixed(1)}s`, JSON.stringify(m));
  }

  await browser.close();
})();
