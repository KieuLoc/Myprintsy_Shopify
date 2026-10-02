const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-blue-lemon-personalized-accent-mug-copy',
    { waitUntil: 'domcontentloaded', timeout: 120000 }
  );
  await page.waitForTimeout(12000);

  // Try open chat
  const clicked = await page.evaluate(() => {
    const el =
      document.querySelector('#ShopifyChat') ||
      document.querySelector('inbox-online-store-chat');
    if (!el) return { ok: false, reason: 'no chat el' };
    el.click();
    return { ok: true, tag: el.tagName, id: el.id };
  });
  await page.waitForTimeout(2000);

  const data = await page.evaluate(() => {
    const chat =
      document.querySelector('#ShopifyChat') ||
      document.querySelector('inbox-online-store-chat');
    const dock = document.getElementById('myprintsy-sticky-preview-dock');
    const info = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        tag: el.tagName,
        id: el.id,
        className: String(el.className || '').slice(0, 120),
        attrs: Array.from(el.attributes || [])
          .map((a) => a.name + '=' + a.value)
          .slice(0, 20),
        rect: {
          w: Math.round(r.width),
          h: Math.round(r.height),
          top: Math.round(r.top),
          bottom: Math.round(r.bottom),
        },
        z: cs.zIndex,
        display: cs.display,
        visibility: cs.visibility,
        shadow: !!el.shadowRoot,
      };
    };

    let shadowKids = [];
    try {
      if (chat && chat.shadowRoot) {
        shadowKids = Array.from(chat.shadowRoot.querySelectorAll('*'))
          .slice(0, 40)
          .map((n) => {
            const r = n.getBoundingClientRect();
            return {
              tag: n.tagName,
              cls: String(n.className || '').slice(0, 80),
              w: Math.round(r.width),
              h: Math.round(r.height),
              z: getComputedStyle(n).zIndex,
            };
          })
          .filter((x) => x.w > 20 && x.h > 20);
      }
    } catch (e) {
      shadowKids = [{ err: String(e) }];
    }

    return {
      bodyChatOpen: document.body.classList.contains('myprintsy-chat-open'),
      chat: info(chat),
      dock: info(dock),
      dockVisible: dock && dock.classList.contains('is-visible'),
      shadowKids,
      bigFixed: Array.from(document.querySelectorAll('body *'))
        .filter((el) => {
          const cs = getComputedStyle(el);
          if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
          const r = el.getBoundingClientRect();
          return r.height > 300 && r.width > 250;
        })
        .slice(0, 15)
        .map((el) => ({
          tag: el.tagName,
          id: el.id,
          cls: String(el.className || '').slice(0, 80),
          h: Math.round(el.getBoundingClientRect().height),
          z: getComputedStyle(el).zIndex,
        })),
    };
  });

  console.log(JSON.stringify({ clicked, data }, null, 2));
  await page.screenshot({ path: 'scripts/_chat-open-sticky.png' });
  await browser.close();
})();
