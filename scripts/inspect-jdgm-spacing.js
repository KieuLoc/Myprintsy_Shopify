/**
 * Inspect Judge.me + accordion spacing on DEV PDP.
 */
const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/make-it-happen-personalized-accent-mug?preview_theme_id=186878558524';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(10000);
  // scroll to trigger lazy widgets
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.55));
  await page.waitForTimeout(5000);

  const data = await page.evaluate(() => {
    const override = document.getElementById('myprintsy-jdgm-star-override');
    const allJdgm = [...document.querySelectorAll('[class*="jdgm"]')]
      .slice(0, 40)
      .map((el) => el.className.toString().slice(0, 80));
    const revSelectors = [
      '.jdgm-rev',
      '.jdgm-rev-widg__reviews .jdgm-rev',
      '[data-expanded-reviews] .jdgm-rev',
      '.jdgm-gallery-wrapper',
      '.jdgm-rev-widg__body',
      '#judgeme_product_reviews',
      '.jdgm-rev-widg',
      '.jdgm-widget',
    ];
    const counts = {};
    for (const s of revSelectors) counts[s] = document.querySelectorAll(s).length;

    const revs = [...document.querySelectorAll('.jdgm-rev, .jdgm-rev-card, .jdgm-histogram__row')]
      .slice(0, 5)
      .map((el, i) => {
        const cs = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const next = el.nextElementSibling;
        const gapToNext = next ? Math.round(next.getBoundingClientRect().top - rect.bottom) : null;
        return {
          i,
          cls: el.className.toString().slice(0, 60),
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          height: Math.round(rect.height),
          gapToNext,
          inlinePadTop: el.style.paddingTop,
        };
      });

    const widg = document.querySelector('.jdgm-rev-widg, #judgeme_product_reviews, .jdgm-widget');
    const widgCs = widg ? getComputedStyle(widg) : null;
    const section = widg ? widg.closest('.shopify-section') : null;
    const sectionCs = section ? getComputedStyle(section) : null;
    const mainSection = document.querySelector('.product')?.closest('.shopify-section');
    const mainCs = mainSection ? getComputedStyle(mainSection) : null;

    let gapMainToReviews = null;
    if (mainSection && section) {
      gapMainToReviews = Math.round(
        section.getBoundingClientRect().top - mainSection.getBoundingClientRect().bottom
      );
    }

    const titleEl = document.querySelector('.jdgm-rev-widg__title, .jdgm-widget-title, h2');
    const personalization = [...document.querySelectorAll('.product__accordion .accordion__title')].find(
      (el) => /personalization/i.test(el.textContent || '')
    );
    let gapAccordionToTitle = null;
    if (personalization && titleEl) {
      const acc = personalization.closest('.product__accordion') || personalization;
      gapAccordionToTitle = Math.round(
        titleEl.getBoundingClientRect().top - acc.getBoundingClientRect().bottom
      );
    }

    // dump first review outerHTML snippet
    const firstRev = document.querySelector('.jdgm-rev, .jdgm-rev-card');
    const htmlSnippet = firstRev ? firstRev.outerHTML.slice(0, 500) : null;
    const widgHtml = widg ? widg.outerHTML.slice(0, 800) : null;

    return {
      title: document.title,
      hasOverride: !!override,
      overrideHasPad8: override ? /padding-top:8px/.test(override.textContent) : false,
      counts,
      revs,
      widg: widgCs
        ? {
            cls: widg.className.toString().slice(0, 80),
            mt: widgCs.marginTop,
            mb: widgCs.marginBottom,
            pt: widgCs.paddingTop,
            pb: widgCs.paddingBottom,
          }
        : null,
      section: sectionCs
        ? {
            id: section.id,
            mt: sectionCs.marginTop,
            pt: sectionCs.paddingTop,
            pb: sectionCs.paddingBottom,
          }
        : null,
      mainSection: mainCs
        ? { id: mainSection.id, pb: mainCs.paddingBottom, mb: mainCs.marginBottom }
        : null,
      gapMainToReviews,
      gapAccordionToTitle,
      allJdgmSample: allJdgm,
      htmlSnippet,
      widgHtml,
      cssLoaded: !!document.querySelector('link[href*="judgeme-stars"]'),
      jsLoaded: !!document.querySelector('script[src*="judgeme-stars"]'),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
