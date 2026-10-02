const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

async function measure(page) {
  return page.evaluate(() => {
    const img = document.querySelector('.product__media-item.is-active img');
    const thumb = document.querySelector('.thumbnail-slider');
    const container = document.querySelector('.product-media-container');
    const ib = img?.getBoundingClientRect().bottom ?? 0;
    const tt = thumb?.getBoundingClientRect().top ?? 0;
    const tb = thumb?.getBoundingClientRect().bottom ?? 0;
    const cb = container?.getBoundingClientRect().bottom ?? 0;
    return {
      gapImgThumb: Math.round(tt - ib),
      gapThumbContainer: Math.round(tb - cb),
      imgH: img ? Math.round(img.getBoundingClientRect().height) : null,
      containerH: container ? Math.round(container.getBoundingClientRect().height) : null,
      thumbMt: thumb ? getComputedStyle(thumb).marginTop : null,
    };
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  await page.route('**/*section-main-product.css*', async (route) => {
    const resp = await route.fetch();
    let body = await resp.text();
    body = body.replace(
      /\/\* Ảnh chính[\s\S]*?product-info \.product__media-wrapper \.thumbnail-list\.slider \{[\s\S]*?\}\s*\}/m,
      '}'
    );
    await route.fulfill({ response: resp, body, headers: resp.headers() });
  });

  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  console.log('baseline (no -11rem)', await measure(page));

  const tests = [
    ['crop-34rem', `product-info .product__media-wrapper .product-media-container.constrain-height .media{padding-top:min(34rem,var(--ratio-percent))!important;}`],
    ['crop-32rem', `product-info .product__media-wrapper .product-media-container.constrain-height .media{padding-top:min(32rem,var(--ratio-percent))!important;}`],
    ['crop-30rem', `product-info .product__media-wrapper .product-media-container.constrain-height .media{padding-top:min(30rem,var(--ratio-percent))!important;}`],
    ['mt-4rem', `product-info .product__media-wrapper .thumbnail-slider{margin-top:-4rem!important;}`],
    ['crop-34+mb', `product-info .product__media-wrapper .product-media-container.constrain-height .media{padding-top:min(34rem,var(--ratio-percent))!important;}product-info .product__media-wrapper .thumbnail-slider{margin-top:-1rem!important;}`],
  ];

  for (const [name, css] of tests) {
    await page.evaluate((rule) => {
      let s = document.getElementById('_t');
      if (!s) {
        s = document.createElement('style');
        s.id = '_t';
        document.head.appendChild(s);
      }
      s.textContent = `@media(max-width:749px){${rule}}`;
    }, css);
    await page.waitForTimeout(300);
    const m = await measure(page);
    console.log(name, m);
    await page.screenshot({ path: `scripts/_test-${name}.png` });
  }

  await browser.close();
})();
