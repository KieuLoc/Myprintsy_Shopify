const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForSelector('#judgeme_product_reviews', { timeout: 60000 });
  await page.evaluate(() => {
    document.querySelector('.related-products__heading')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(4000);
  await page.waitForFunction(
    () => document.querySelector('.related-products__heading')?.textContent?.includes('You may also like'),
    { timeout: 30000 }
  ).catch(() => {});
  await page.waitForTimeout(1000);

  const data = await page.evaluate(() => {
    function cs(el) {
      return el ? getComputedStyle(el) : null;
    }
    function bottom(el) {
      return el ? Math.round(el.getBoundingClientRect().bottom) : null;
    }
    function top(el) {
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    }

    const review = document.querySelector('#judgeme_product_reviews');
    const heading = document.querySelector('.related-products__heading');
    const related = document.querySelector('product-recommendations.related-products');
    const reviewSection = review?.closest('.shopify-section');
    const relatedSection = related?.closest('.shopify-section');
    const gradientWrap = related?.parentElement;
    const between = [];

    if (reviewSection && relatedSection) {
      let el = reviewSection.nextElementSibling;
      while (el && el !== relatedSection) {
        const r = el.getBoundingClientRect();
        between.push({
          id: el.id,
          cls: el.className.slice(0, 80),
          h: Math.round(r.height),
          display: cs(el).display,
          mt: cs(el).marginTop,
          mb: cs(el).marginBottom,
        });
        el = el.nextElementSibling;
      }
    }

    const lastReview = document.querySelector('#judgeme_product_reviews .jm-review-item:last-child');
    const relatedTop = top(related);
    const lastBottom = bottom(lastReview);

    const gapElements = [];
    if (review && related) {
      const all = review.querySelectorAll('*');
      all.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height <= 0) return;
        const b = Math.round(r.bottom);
        const t = Math.round(r.top);
        if (b > lastBottom && t < relatedTop) {
          gapElements.push({
            tag: el.tagName,
            cls: String(el.className).slice(0, 70),
            top: t,
            bottom: b,
            h: Math.round(r.height),
            mb: cs(el).marginBottom,
            pb: cs(el).paddingBottom,
            mt: cs(el).marginTop,
            pt: cs(el).paddingTop,
          });
        }
      });
    }

    return {
      hasHeading: !!heading,
      headingText: heading?.textContent?.trim(),
      gapLastReviewToHeading: lastReview && heading ? top(heading) - bottom(lastReview) : null,
      gapLastReviewToRelated: lastReview && related ? top(related) - bottom(lastReview) : null,
      gapReviewSectionToRelatedSection:
        reviewSection && relatedSection ? top(relatedSection) - bottom(reviewSection) : null,
      gapRelatedTopToHeading: related && heading ? top(heading) - top(related) : null,
      relatedPaddingTop: related ? cs(related).paddingTop : null,
      relatedMarginTop: related ? cs(related).marginTop : null,
      gradientPadTop: gradientWrap ? cs(gradientWrap).paddingTop : null,
      gradientMarginTop: gradientWrap ? cs(gradientWrap).marginTop : null,
      headingPadTop: heading ? cs(heading).paddingTop : null,
      headingMt: heading ? cs(heading).marginTop : null,
      reviewSectionPb: reviewSection ? cs(reviewSection).paddingBottom : null,
      reviewSectionMb: reviewSection ? cs(reviewSection).marginBottom : null,
      pageWidthPb: review?.closest('.page-width') ? cs(review.closest('.page-width')).paddingBottom : null,
      judgemePb: review ? cs(review).paddingBottom : null,
      judgemeMb: review ? cs(review).marginBottom : null,
      judgemeHeight: review ? Math.round(review.getBoundingClientRect().height) : null,
      lastReviewBottom: bottom(lastReview),
      headingTop: top(heading),
      betweenSections: between,
      relatedSectionId: relatedSection?.id,
      reviewSectionId: reviewSection?.id,
      gapElements: gapElements.slice(0, 15),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
