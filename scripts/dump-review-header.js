const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://wanderprints.com/products/family-monogram-with-address-vintage-decor-personalized-doormat-pt1859cin4018';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.includes('Customer Reviews'), {
    timeout: 45000,
  });
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    const dump = (el) =>
      el
        ? {
            tag: el.tagName,
            cls: el.className,
            text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
            html: el.outerHTML.slice(0, 2200),
          }
        : null;

    const root =
      document.querySelector('#judgeme_product_reviews') ||
      document.querySelector('.jdgm-rev-widg') ||
      document.querySelector('.jdgm-widget-revamp');

    const header =
      document.querySelector('.jdgm-rev-widg__header') ||
      document.querySelector('.jm-review-widget__header') ||
      document.querySelector('.jm-review-widget-minimal-header');

    const avg = document.querySelector(
      '.jdgm-rev-widg__summary-average, .jm-average-rating, .jm-review-widget-minimal-header__average-rating, [class*="average-rating"], [class*="summary-average"]'
    );

    const writes = [...document.querySelectorAll('a, button, span')].filter((e) =>
      /^write a review$/i.test((e.textContent || '').trim())
    ).map((e) => ({
      tag: e.tagName,
      cls: e.className,
      display: getComputedStyle(e).display,
      border: getComputedStyle(e).border,
      radius: getComputedStyle(e).borderRadius,
      pad: getComputedStyle(e).padding,
      size: getComputedStyle(e).fontSize,
      color: getComputedStyle(e).color,
      parent: e.parentElement && e.parentElement.className,
    }));

    const stars = document.querySelector(
      '.jdgm-rev-widg__summary-stars .jdgm-star, .jm-star-rating__font-icon, .jm-review-widget-minimal-header .jm-star-rating'
    );

    return {
      url: location.href,
      rootCls: root && root.className,
      header: dump(header),
      avg: avg && {
        cls: avg.className,
        text: avg.textContent.trim(),
        color: getComputedStyle(avg).color,
        size: getComputedStyle(avg).fontSize,
        weight: getComputedStyle(avg).fontWeight,
      },
      starSize: stars && getComputedStyle(stars).fontSize,
      writes,
      summary: dump(document.querySelector('.jdgm-rev-widg__summary, .jm-review-widget-minimal-header__summary')),
      rowStars: dump(document.querySelector('.jdgm-row-stars')),
      actions: dump(document.querySelector('.jdgm-widget-actions-wrapper, .jm-review-widget-minimal-header__actions')),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
