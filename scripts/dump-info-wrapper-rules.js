const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(
    'https://www.myprintsy.com/products/study-dream-achieve-personalized-tumbler-cup-scthth1l14',
    { waitUntil: 'load', timeout: 120000 }
  );
  await page.waitForTimeout(8000);

  const rules = await page.evaluate(() => {
    const infoWrap = document.querySelector('.product__info-wrapper');
    const out = [];
    for (const sheet of document.styleSheets) {
      let cssRules;
      try {
        cssRules = sheet.cssRules;
      } catch (_) {
        continue;
      }
      const walk = (list, media) => {
        for (const rule of list) {
          if (rule.type === CSSRule.STYLE_RULE) {
            try {
              if (
                infoWrap.matches(rule.selectorText) &&
                (rule.style.paddingTop || rule.style.padding)
              ) {
                out.push({
                  sel: rule.selectorText,
                  pt: rule.style.paddingTop,
                  pad: rule.style.padding,
                  imp: rule.style.getPropertyPriority('padding-top'),
                  media: media || null,
                  href: sheet.href || 'inline',
                });
              }
            } catch (_) {}
          } else if (rule.type === CSSRule.MEDIA_RULE) {
            walk(rule.cssRules, rule.conditionText);
          }
        }
      };
      walk(cssRules, null);
    }
    return out;
  });

  console.log(JSON.stringify(rules, null, 2));
  await browser.close();
})();
