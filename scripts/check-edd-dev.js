const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13?preview_theme_id=186878558524',
    { waitUntil: 'domcontentloaded', timeout: 90000 }
  );
  await page.waitForTimeout(8000);
  await page.evaluate(() => document.querySelector('.sb_ETA')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(500);
  const data = await page.evaluate(() => {
    const eta = document.querySelector('.sb_ETA');
    const r = eta?.getBoundingClientRect();
    return {
      has: !!eta,
      text: eta?.textContent?.trim().slice(0, 120),
      h: r ? Math.round(r.height) : 0,
      display: eta ? getComputedStyle(eta).display : null,
      prev: eta?.previousElementSibling?.className?.toString?.().slice(0, 60),
      next: eta?.nextElementSibling?.tagName,
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/edd-dev.png' });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
