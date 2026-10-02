const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('https://www.myprintsy.com/search?q=Blue+Lemon+Accent+Mug', {
    waitUntil: 'load',
    timeout: 120000,
  });
  await page.waitForTimeout(3000);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('a[href*="/products/"]')]
      .map((a) => a.href)
      .slice(0, 5)
  );
  console.log(hrefs.join('\n'));
  await browser.close();
})();
