const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
  await page.goto(
    'https://wanderprints.com/products/family-monogram-with-address-vintage-decor-personalized-doormat-pt1859cin4018?variant=51849462546715',
    { waitUntil: 'domcontentloaded', timeout: 90000 }
  );
  await page.waitForTimeout(8000);

  const data = await page.evaluate(() => {
    const candidates = [...document.querySelectorAll('div,section')].filter((el) => {
      const t = el.innerText || '';
      return /Delivery to/i.test(t) && /Order today and get it by/i.test(t) && t.length < 500;
    });
    const best = candidates.sort((a, b) => a.innerText.length - b.innerText.length)[0];

    // Click country name if found
    const countryBtn = best
      ? [...best.querySelectorAll('a,button,span,div')].find((el) => {
          const t = (el.textContent || '').trim();
          return (
            el.children.length === 0 &&
            t.length > 2 &&
            t.length < 40 &&
            !/Delivery to|Order today|get it by/i.test(t)
          );
        })
      : null;

    return {
      bestHtml: best ? best.outerHTML.slice(0, 6000) : null,
      bestCls: best ? String(best.className).slice(0, 160) : null,
      bestText: best ? best.innerText.replace(/\s+/g, ' ').slice(0, 300) : null,
      countryBtn: countryBtn
        ? {
            tag: countryBtn.tagName,
            cls: String(countryBtn.className).slice(0, 120),
            text: countryBtn.textContent.trim(),
            href: countryBtn.getAttribute('href'),
            role: countryBtn.getAttribute('role'),
            onclick: countryBtn.getAttribute('onclick'),
          }
        : null,
      matches: candidates.slice(0, 6).map((el) => ({
        cls: String(el.className).slice(0, 100),
        text: el.innerText.replace(/\s+/g, ' ').slice(0, 160),
      })),
    };
  });

  fs.writeFileSync('scripts/wp-delivery-dump.json', JSON.stringify(data, null, 2));
  console.log(JSON.stringify({ bestCls: data.bestCls, countryBtn: data.countryBtn, text: data.bestText }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
