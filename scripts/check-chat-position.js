const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);

  const data = await page.evaluate(() => {
    const nodes = [
      document.querySelector('#dummy-chat-button-iframe'),
      document.querySelector('iframe[name="dummy-chat-button-iframe"]'),
      document.querySelector('#shopify-chat'),
      document.querySelector('#ShopifyChat'),
      document.querySelector('iframe#ShopifyChat'),
    ].filter(Boolean);

    const dock = document.getElementById('myprintsy-sticky-preview-dock');
    const styleTag = document.getElementById('myprintsy-shopify-chat');

    return {
      hasStyleTag: !!styleTag,
      styleText: styleTag?.textContent?.slice(0, 300) || null,
      dock: dock
        ? {
            h: dock.offsetHeight,
            rect: {
              top: Math.round(dock.getBoundingClientRect().top),
              bottom: Math.round(dock.getBoundingClientRect().bottom),
            },
          }
        : null,
      nodes: nodes.map((el) => ({
        id: el.id,
        name: el.getAttribute('name'),
        tag: el.tagName,
        inlineBottom: el.style?.bottom || null,
        computedBottom: getComputedStyle(el).bottom,
        computedTop: getComputedStyle(el).top,
        computedTransform: getComputedStyle(el).transform,
        rect: {
          top: Math.round(el.getBoundingClientRect().top),
          bottom: Math.round(el.getBoundingClientRect().bottom),
          right: Math.round(el.getBoundingClientRect().right),
        },
        viewportH: window.innerHeight,
        gapFromBottom: Math.round(window.innerHeight - el.getBoundingClientRect().bottom),
      })),
      allChatIframes: Array.from(document.querySelectorAll('iframe'))
        .filter((f) => /chat|inbox|shopify/i.test(f.id + f.name + (f.src || '')))
        .map((f) => ({
          id: f.id,
          name: f.name,
          src: (f.src || '').slice(0, 120),
          bottom: getComputedStyle(f).bottom,
          inlineBottom: f.style.bottom,
          gapFromBottom: Math.round(window.innerHeight - f.getBoundingClientRect().bottom),
        })),
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await page.screenshot({ path: 'scripts/_chat-position-check.png', fullPage: false });
  await browser.close();
})();
