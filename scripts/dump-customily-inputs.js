/** Dump Customily personalization controls on mobile PDP. */
const { chromium } = require('playwright');

const PRODUCT =
  process.env.ATC_URL ||
  'https://www.myprintsy.com/products/with-a-fck-fck-here-personalized-ceramic-coffee-mug';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  const page = await context.newPage();
  await page.goto(PRODUCT, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(15000);

  const info = await page.evaluate(() => {
    const out = { containers: [], controls: [], iframes: [] };
    document
      .querySelectorAll('[id*="customily" i], [class*="customily" i]')
      .forEach((el) => out.containers.push({ tag: el.tagName, id: el.id, cls: String(el.className).slice(0, 90) }));

    document.querySelectorAll('input, textarea, select').forEach((el) => {
      const rects = el.getClientRects().length;
      out.controls.push({
        tag: el.tagName,
        type: el.type,
        name: el.name,
        id: el.id,
        cls: String(el.className || '').slice(0, 60),
        placeholder: el.placeholder || null,
        visible: Boolean(rects),
        inCustomily: Boolean(el.closest('[id*="customily" i], [class*="customily" i]')),
        value: String(el.value || '').slice(0, 30),
      });
    });

    document.querySelectorAll('iframe').forEach((f) => out.iframes.push({ src: (f.src || '').slice(0, 120) }));
    return out;
  });

  console.log('containers:', JSON.stringify(info.containers.slice(0, 25), null, 1));
  console.log(
    'visible controls:',
    JSON.stringify(
      info.controls.filter((c) => c.visible && c.type !== 'hidden'),
      null,
      1
    )
  );
  console.log('customily controls:', JSON.stringify(info.controls.filter((c) => c.inCustomily), null, 1));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
