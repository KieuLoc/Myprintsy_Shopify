const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await page.goto(
    'https://wanderprints.com/products/family-monogram-with-address-vintage-decor-personalized-doormat-pt1859cin4018?variant=51849462546715',
    { waitUntil: 'domcontentloaded', timeout: 90000 }
  );
  await page.waitForTimeout(8000);

  const data = await page.evaluate(() => {
    const country = document.querySelector('.country-name');
    let root = country;
    for (let i = 0; i < 8 && root; i++) {
      if (/Delivery to/i.test(root.innerText) && /Order today/i.test(root.innerText)) break;
      root = root.parentElement;
    }
    const styles = {};
    if (root) {
      const cs = getComputedStyle(root);
      styles.root = {
        border: cs.border,
        borderRadius: cs.borderRadius,
        padding: cs.padding,
        background: cs.backgroundColor,
      };
    }
    if (country) {
      const cs = getComputedStyle(country);
      styles.country = { color: cs.color, fontWeight: cs.fontWeight, cursor: cs.cursor };
    }
    return {
      rootHtml: root ? root.outerHTML.slice(0, 8000) : null,
      styles,
      countryParentHtml: country ? country.parentElement.outerHTML.slice(0, 2000) : null,
    };
  });

  fs.writeFileSync('scripts/wp-delivery-html.json', JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ styles: data.styles, htmlPreview: data.rootHtml && data.rootHtml.slice(0, 1500) }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
