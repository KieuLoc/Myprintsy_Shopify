const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy',
    { waitUntil: 'domcontentloaded', timeout: 120000 }
  );
  await page.waitForTimeout(15000);

  // Try type into customily fields to trigger live preview
  await page.evaluate(() => {
    const inputs = document.querySelectorAll(
      '#customily-options input, #cl_optionsapp input, .customily_option input[type="text"]'
    );
    inputs.forEach((inp, i) => {
      inp.focus();
      inp.value = i === 0 ? 'fsfdfffsdf' : 'fsdfsdfff';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {
    const media =
      document.querySelector('.product__media-item.is-active .product-media-container') ||
      document.querySelector('.product-media-container') ||
      document.querySelector('media-gallery .media');
    if (!media) return { error: 'no media' };

    const rect = media.getBoundingClientRect();
    const cs = getComputedStyle(media);
    const imgs = Array.from(media.querySelectorAll('img, canvas, svg, iframe, video')).map((el) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        tag: el.tagName,
        cls: String(el.className || '').slice(0, 100),
        src: (el.currentSrc || el.src || '').slice(0, 120),
        w: Math.round(r.width),
        h: Math.round(r.height),
        top: Math.round(r.top - rect.top),
        left: Math.round(r.left - rect.left),
        rightGap: Math.round(rect.right - r.right),
        bottomGap: Math.round(rect.bottom - r.bottom),
        z: s.zIndex,
        position: s.position,
        opacity: s.opacity,
        display: s.display,
        border: s.border,
      };
    });

    // Also look for customily overlays near gallery
    const gallery = document.querySelector('media-gallery, .product__media-wrapper');
    const allNear = gallery
      ? Array.from(gallery.querySelectorAll('*'))
          .filter((el) => {
            const n = (el.className + ' ' + el.id + ' ' + el.tagName).toLowerCase();
            return (
              n.includes('customily') ||
              n.includes('cl-') ||
              n.includes('preview') ||
              el.tagName === 'CANVAS'
            );
          })
          .slice(0, 30)
          .map((el) => {
            const r = el.getBoundingClientRect();
            return {
              tag: el.tagName,
              id: el.id,
              cls: String(el.className || '').slice(0, 80),
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          })
      : [];

    return {
      media: {
        cls: media.className,
        w: Math.round(rect.width),
        h: Math.round(rect.height),
        border: cs.border,
        borderWidth: cs.borderWidth,
        boxShadow: cs.boxShadow,
        overflow: cs.overflow,
        outline: cs.outline,
      },
      imgs,
      allNear,
      globalMediaBorder: getComputedStyle(document.documentElement).getPropertyValue(
        '--media-border-width'
      ),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await page.locator('media-gallery, .product__media-wrapper').first().screenshot({
    path: 'scripts/_gallery-overlap.png',
  });
  await browser.close();
})();
