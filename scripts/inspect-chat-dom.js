const { chromium } = require('playwright');
const URL =
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForTimeout(12000);

  const data = await page.evaluate(() => {
    const walk = (root, depth = 0, out = []) => {
      if (depth > 6) return out;
      const sel = ['#ShopifyChat', '#shopify-chat', '#dummy-chat-button-iframe', 'inbox-online-store-chat'];
      for (const s of sel) {
        root.querySelectorAll(s).forEach((el) => {
          const r = el.getBoundingClientRect();
          out.push({
            sel: s,
            tag: el.tagName,
            id: el.id,
            depth,
            bottom: getComputedStyle(el).bottom,
            inlineBottom: el.style.bottom,
            h: Math.round(r.height),
            w: Math.round(r.width),
            gapFromBottom: Math.round(window.innerHeight - r.bottom),
            children: el.children?.length,
            shadow: !!el.shadowRoot,
          });
          if (el.shadowRoot) walk(el.shadowRoot, depth + 1, out);
        });
      }
      root.querySelectorAll('*').forEach((el) => {
        if (el.shadowRoot) walk(el.shadowRoot, depth + 1, out);
      });
      return out;
    };
    return {
      dockH: document.getElementById('myprintsy-sticky-preview-dock')?.offsetHeight,
      tree: walk(document),
      iframes: Array.from(document.querySelectorAll('iframe')).map((f) => ({
        id: f.id,
        name: f.name,
        parent: f.parentElement?.id || f.parentElement?.tagName,
        gap: Math.round(window.innerHeight - f.getBoundingClientRect().bottom),
        h: Math.round(f.getBoundingClientRect().height),
      })),
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
