const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.addInitScript(() => {
    window.__gapLog = [];
    const log = () => {
      const img = document.querySelector('.product__media-item.is-active img');
      const thumb = document.querySelector('.thumbnail-slider');
      const wrapper = document.querySelector('.product__media-wrapper');
      if (!img || !thumb) return;
      const ib = img.getBoundingClientRect().bottom;
      const tt = thumb.getBoundingClientRect().top;
      const wb = wrapper ? wrapper.getBoundingClientRect().bottom : 0;
      window.__gapLog.push({
        t: Math.round(performance.now()),
        gap: Math.round(tt - ib),
        imgH: Math.round(img.getBoundingClientRect().height),
        thumbMt: getComputedStyle(thumb).marginTop,
        hasPin: !!document.getElementById('myprintsy-pdp-gallery-spacing'),
      });
    };
    new MutationObserver(log).observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });
    document.addEventListener('DOMContentLoaded', log);
    setInterval(log, 200);
  });

  await page.goto(URL, { waitUntil: 'commit', timeout: 120000 });
  await page.waitForTimeout(15000);

  const log = await page.evaluate(() => window.__gapLog);
  const uniq = [];
  let last = null;
  for (const row of log) {
    const key = `${row.gap}|${row.imgH}|${row.thumbMt}|${row.hasPin}`;
    if (key !== last) {
      uniq.push(row);
      last = key;
    }
  }
  console.log(JSON.stringify(uniq.slice(0, 40), null, 2));
  console.log('... total changes', uniq.length);
  await browser.close();
})();
