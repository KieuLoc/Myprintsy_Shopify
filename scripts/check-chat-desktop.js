const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto('https://www.myprintsy.com/', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(15000);

  const data = await page.evaluate(() => {
    const nodes = [
      document.querySelector('#ShopifyChat'),
      ...document.querySelectorAll('inbox-online-store-chat'),
      document.querySelector('#shopify-chat'),
    ].filter(Boolean);

    return {
      viewport: { w: window.innerWidth, h: window.innerHeight },
      nodes: nodes.map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          id: el.id,
          tag: el.tagName,
          visible: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0',
          rect: { top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) },
          bottom: cs.bottom,
          inlineBottom: el.style.bottom,
          transform: cs.transform,
          opacity: cs.opacity,
          display: cs.display,
          zIndex: cs.zIndex,
        };
      }),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/_chat-desktop-check.png' });
  await browser.close();
})();
