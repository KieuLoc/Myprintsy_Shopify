const { chromium } = require('playwright');

const urls = [
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13',
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13?preview_theme_id=186878558524',
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });

  for (const url of urls) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForTimeout(8000);
    const data = await page.evaluate(() => {
      const slots = [...document.querySelectorAll('.custom_delivery_estimation_widget')];
      const etas = [...document.querySelectorAll('.sb_ETA, [class*="sb_"], [id*="edd"], [class*="edd"]')];
      const scripts = [...document.querySelectorAll('script[src*="edd"]')].map((s) => s.src);
      return {
        href: location.href,
        hasDeliveredText: document.body.innerText.includes('Delivered to'),
        hasEstimatedText: document.body.innerText.includes('Estimated delivery'),
        findSpecificEDDMsg: typeof window.findSpecificEDDMsg,
        eddScripts: scripts,
        slots: slots.map((s) => ({
          text: s.textContent.trim().slice(0, 100),
          htmlLen: s.innerHTML.length,
          display: getComputedStyle(s).display,
          h: Math.round(s.getBoundingClientRect().height),
          parent: s.parentElement?.className?.slice?.(0, 80) || s.parentElement?.tagName,
        })),
        etas: etas.slice(0, 20).map((e) => ({
          tag: e.tagName,
          cls: String(e.className).slice(0, 80),
          id: e.id,
          text: e.textContent.trim().slice(0, 100),
          display: getComputedStyle(e).display,
          h: Math.round(e.getBoundingClientRect().height),
          parent: e.parentElement?.className?.slice?.(0, 60) || e.parentElement?.tagName,
        })),
      };
    });
    console.log(JSON.stringify(data, null, 2));
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
