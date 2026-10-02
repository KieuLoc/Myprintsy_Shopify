const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(8000);

  const data = await page.evaluate(() => {
    const labels = [...document.querySelectorAll('legend.form__label, .product-form__input .form__label')];
    return labels.map((el) => {
      const cs = getComputedStyle(el);
      return {
        text: el.textContent.trim().slice(0, 40),
        fw: cs.fontWeight,
        ff: cs.fontFamily.slice(0, 40),
        fs: cs.fontSize,
      };
    });
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
