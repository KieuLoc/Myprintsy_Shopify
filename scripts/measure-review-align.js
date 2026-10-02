/**
 * Measure left edges: main image vs thumbnails vs Customer Reviews.
 */
const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13?preview_theme_id=186878558524';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.body.innerText.includes('Customer Reviews'), {
    timeout: 30000,
  });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const left = (el) => (el ? Math.round(el.getBoundingClientRect().left) : null);
    const mainImg =
      document.querySelector('.product__media-item.is-active img') ||
      document.querySelector('.product__media-list .product__media-item img') ||
      document.querySelector('.product__media img');
    const thumb =
      document.querySelector('.thumbnail-list .thumbnail') ||
      document.querySelector('.thumbnail-list img');
    const thumbSlider = document.querySelector('.thumbnail-slider');
    const reviewTitle =
      document.querySelector('.jm-review-widget-minimal-header__title') ||
      document.querySelector('#judgeme_product_reviews');
    const reviewSection = document.querySelector('#judgeme_product_reviews')?.closest('.shopify-section');
    const pageWidth = document.querySelector('#judgeme_product_reviews')?.closest('.page-width');
    const mediaWrapper = document.querySelector('.product__media-wrapper');
    const product = document.querySelector('.product');

    return {
      mainImgLeft: left(mainImg),
      thumbLeft: left(thumb),
      thumbSliderLeft: left(thumbSlider),
      reviewTitleLeft: left(reviewTitle),
      reviewSectionLeft: left(reviewSection),
      pageWidthLeft: left(pageWidth),
      mediaWrapperLeft: left(mediaWrapper),
      productLeft: left(product),
      deltaThumbVsMain: left(thumb) != null && left(mainImg) != null ? left(thumb) - left(mainImg) : null,
      deltaReviewVsMain:
        left(reviewTitle) != null && left(mainImg) != null ? left(reviewTitle) - left(mainImg) : null,
      pageWidthPad: pageWidth ? getComputedStyle(pageWidth).paddingLeft : null,
      thumbSliderPad: thumbSlider ? getComputedStyle(thumbSlider).paddingLeft : null,
      thumbnailSliderHTML: thumbSlider
        ? {
            cls: thumbSlider.className,
            padL: getComputedStyle(thumbSlider).paddingLeft,
            marL: getComputedStyle(thumbSlider).marginLeft,
            buttonW: document.querySelector('.thumbnail-slider .slider-button')
              ? Math.round(
                  document.querySelector('.thumbnail-slider .slider-button').getBoundingClientRect().width
                )
              : null,
          }
        : null,
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
