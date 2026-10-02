const { chromium } = require('playwright');

const URL =
  'https://myprintsy-3.myshopify.com/products/creep-it-real-personalized-accent-mug-gift-for-halloween-hwth1l30?preview_theme_id=186878558524';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const imgs = [];
  page.on('request', (req) => {
    if (req.resourceType() === 'image') imgs.push(req.url());
  });

  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  const before = await page.evaluate(() => {
    const deferred = Array.from(document.querySelectorAll('img[data-myprintsy-defer-src]')).map((img) => ({
      src: img.getAttribute('src'),
      deferSrc: img.dataset.myprintsyDeferSrc,
      armed: img.dataset.myprintsyDeferArmed || '',
      className: img.className,
    }));
    const open = !!document.querySelector('.cart-reminder-popup.is-open');
    return { deferredCount: deferred.length, deferred, open };
  });

  const reminderRe = /1_01\.png|866e1f9d-35ae-438c-9a08-bd8d1f5b317f|20260703-144920/i;
  console.log(
    JSON.stringify(
      {
        beforeOpen: {
          open: before.open,
          deferredCount: before.deferredCount,
          deferredSample: before.deferred.slice(0, 8),
          reminderImageRequests: imgs.filter((u) => reminderRe.test(u)),
        },
        totalImagesSoFar: imgs.length,
      },
      null,
      2
    )
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
