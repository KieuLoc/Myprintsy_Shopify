const { chromium } = require('playwright');

const urls = [
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-ceramic-round-plate-plates-for-desserts',
  'https://www.myprintsy.com/search?q=Personalized+Ceramic+Round+Plate+Blue+Lemon',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // Find product URL from search if needed
  await page.goto(urls[1], { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  const found = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a[href*="/products/"]')];
    const hit = links.find((a) => /ceramic|plate|round/i.test(a.href + a.textContent));
    return hit ? hit.href : links.slice(0, 5).map((a) => a.href);
  });
  console.log('searchFound', JSON.stringify(found, null, 2));

  const productUrl = typeof found === 'string' ? found : urls[0];
  for (const url of [productUrl, productUrl + (productUrl.includes('?') ? '&' : '?') + 'preview_theme_id=186878558524']) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(9000);
    const data = await page.evaluate(() => {
      const info = document.querySelector('.product__info-container');
      const eta = document.querySelector('.sb_ETA');
      const slots = [...document.querySelectorAll('.custom_delivery_estimation_widget')];
      const variant = document.querySelector('variant-selects, variant-radios');
      const form = document.querySelector('product-form, .product-form, form[action*="/cart/add"]');
      return {
        href: location.href,
        title: document.querySelector('.product__title h1, .product__title')?.textContent?.trim().slice(0, 80),
        hasDelivered: document.body.innerText.includes('Delivered to'),
        findSpecificEDDMsg: typeof window.findSpecificEDDMsg,
        eta: eta
          ? {
              text: eta.textContent.trim().slice(0, 120),
              display: getComputedStyle(eta).display,
              h: Math.round(eta.getBoundingClientRect().height),
              parent: eta.parentElement?.className?.toString?.().slice(0, 80) || eta.parentElement?.tagName,
              prev: eta.previousElementSibling?.tagName + '.' + String(eta.previousElementSibling?.className || '').slice(0, 40),
              next: eta.nextElementSibling?.tagName,
              html: eta.outerHTML.slice(0, 300),
            }
          : null,
        slots: slots.map((s) => ({
          display: getComputedStyle(s).display,
          h: Math.round(s.getBoundingClientRect().height),
          htmlLen: s.innerHTML.length,
          parent: s.parentElement?.className?.toString?.().slice(0, 60),
        })),
        children: info
          ? [...info.children].slice(0, 15).map((c) => ({
              tag: c.tagName,
              cls: String(c.className).slice(0, 60),
              h: Math.round(c.getBoundingClientRect().height),
              text: c.textContent.trim().slice(0, 40).replace(/\s+/g, ' '),
            }))
          : [],
        formHasEta: !!(form && form.querySelector('.sb_ETA')),
        bodyHasSbEta: !!document.querySelector('.sb_ETA'),
        allSb: [...document.querySelectorAll('[class*="sb_"]')].slice(0, 15).map((e) => ({
          cls: String(e.className).slice(0, 50),
          h: Math.round(e.getBoundingClientRect().height),
          display: getComputedStyle(e).display,
        })),
      };
    });
    console.log(JSON.stringify(data, null, 2));
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
