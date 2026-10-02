const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.myprintsy.com/search?q=Blue+Lemon+Ceramic+Round+Plate', {
    waitUntil: 'load',
    timeout: 120000,
  });
  await page.waitForTimeout(3000);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/products/"]')]
      .map((a) => a.href)
      .filter((h, i, a) => a.indexOf(h) === i)
      .slice(0, 10)
  );
  console.log(hrefs.join('\n'));
  await browser.close();
})();
