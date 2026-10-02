const { chromium } = require('playwright');

const URL = 'https://www.myprintsy.com/products/mediterranean-style-majolica-print-la-dolce-vita-personalized-ceramic-plate-plates-for-decoration';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(15000);

  const data = await page.evaluate(() => {
    const all = [];
    const walk = (root, depth = 0) => {
      if (depth > 8) return;
      root.querySelectorAll('*').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 20 || r.height < 20) return;
        const id = el.id || '';
        const cls = typeof el.className === 'string' ? el.className.slice(0, 80) : '';
        const tag = el.tagName;
        if (/chat|inbox|shopify/i.test(id + cls + tag) || (r.bottom > 700 && r.width > 100)) {
          const cs = getComputedStyle(el);
          if (r.bottom > 650 || /chat|inbox/i.test(id + cls + tag)) {
            all.push({
              tag,
              id,
              cls,
              bottom: cs.bottom,
              inlineBottom: el.style?.bottom || '',
              rect: {
                top: Math.round(r.top),
                bottom: Math.round(r.bottom),
                h: Math.round(r.height),
              },
              gapFromViewport: Math.round(window.innerHeight - r.bottom),
            });
          }
        }
      });
      root.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) walk(el.shadowRoot, depth + 1);
      });
    };
    walk(document);
    const shopifyChat = document.querySelector('#ShopifyChat');
    return {
      viewportH: window.innerHeight,
      shopifyChat: shopifyChat
        ? {
            bottom: getComputedStyle(shopifyChat).bottom,
            inline: shopifyChat.style.bottom,
            rect: shopifyChat.getBoundingClientRect(),
          }
        : null,
      bottomElements: all.slice(0, 25),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/_chat-mobile-check.png' });
  await browser.close();
})();
