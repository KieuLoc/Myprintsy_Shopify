const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('https://www.myprintsy.com/', { waitUntil: 'domcontentloaded', timeout: 90000 });
  await page.waitForTimeout(8000);
  await page.evaluate(() => {
    document.querySelector('.footer, [class*="klaviyo-form"]')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    const embeds = [...document.querySelectorAll('[data-newsletter-klaviyo-embed], [class*="klaviyo-form-"]')];
    return embeds.slice(0, 6).map((el) => {
      const root = el.closest('[data-newsletter-klaviyo-embed]') || el;
      const form = el.querySelector('form') || el;
      return {
        cls: String(el.className).slice(0, 80),
        parent: root.className?.toString?.().slice(0, 80),
        html: el.innerHTML.slice(0, 1500),
        inputs: [...el.querySelectorAll('input, button, [role="button"]')].map((n) => ({
          tag: n.tagName,
          type: n.getAttribute('type'),
          placeholder: n.getAttribute('placeholder'),
          text: n.textContent.trim().slice(0, 40),
          cls: String(n.className).slice(0, 80),
        })),
        text: el.textContent.trim().slice(0, 200),
      };
    });
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/klaviyo-vip.png', fullPage: false });
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
