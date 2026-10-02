const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13',
    { waitUntil: 'domcontentloaded', timeout: 90000 }
  );
  await page.waitForTimeout(8000);

  const data = await page.evaluate(() => {
    const eta = document.querySelector('.sb_ETA');
    const price = document.querySelector('[id^="price-"]');
    const variant = document.querySelector('variant-selects, variant-radios');
    const title = document.querySelector('.product__title');
    const form = document.querySelector('.product-form, product-form');
    const info = document.querySelector('.product__info-container');

    function box(el) {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        top: Math.round(r.top + window.scrollY),
        h: Math.round(r.height),
        display: getComputedStyle(el).display,
        visibility: getComputedStyle(el).visibility,
        opacity: getComputedStyle(el).opacity,
        overflow: getComputedStyle(el).overflow,
        cls: String(el.className).slice(0, 80),
        parentCls: String(el.parentElement?.className || '').slice(0, 80),
        prev: el.previousElementSibling?.className?.toString?.().slice(0, 60) || el.previousElementSibling?.tagName,
        next: el.nextElementSibling?.className?.toString?.().slice(0, 60) || el.nextElementSibling?.tagName,
      };
    }

    const children = info
      ? [...info.children].map((c) => ({
          tag: c.tagName,
          cls: String(c.className).slice(0, 70),
          h: Math.round(c.getBoundingClientRect().height),
          text: c.textContent.trim().slice(0, 50).replace(/\s+/g, ' '),
        }))
      : [];

    return {
      eta: box(eta),
      price: box(price),
      variant: box(variant),
      title: box(title),
      form: box(form),
      children,
      deliveryInnerHTML: eta?.querySelector('.sb_delivery')?.innerHTML?.slice(0, 400) || null,
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({
    path: 'scripts/edd-check.png',
    fullPage: false,
  });
  await page.evaluate(() => document.querySelector('.sb_ETA')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'scripts/edd-check-scrolled.png' });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
