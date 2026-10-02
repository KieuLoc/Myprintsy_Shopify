const { chromium } = require('playwright');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/make-it-happen-personalized-tumbler-cup-scthth1l14';

async function snap(page, label) {
  return page.evaluate((label) => {
    const q = (s) => document.querySelector(s);
    const cs = (el) => (el ? getComputedStyle(el) : null);
    const mediaList = q('.product__media-list');
    const thumbList = q('.thumbnail-list');
    const thumbSlider = q('.thumbnail-slider');
    const infoWrap = q('.product__info-wrapper');
    const title = q('.product__info-container .product__title');
    const cssHref = [...document.querySelectorAll('link[rel="stylesheet"]')]
      .map((l) => l.href)
      .filter((h) => h.includes('section-main-product'));

    const matchingRules = [];
    if (infoWrap) {
      for (const sheet of document.styleSheets) {
        let rules;
        try {
          rules = sheet.cssRules;
        } catch (_) {
          continue;
        }
        const walk = (list, media) => {
          for (const rule of list) {
            if (rule.type === CSSRule.STYLE_RULE) {
              try {
                if (infoWrap.matches(rule.selectorText) && (rule.style.paddingTop || rule.style.padding)) {
                  matchingRules.push({
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
        walk(rules, null);
      }
    }

    return {
      label,
      url: location.href,
      cssFiles: cssHref,
      mediaListMb: mediaList ? cs(mediaList).marginBottom : null,
      thumbListMb: thumbList ? cs(thumbList).marginBottom : null,
      thumbSliderMt: thumbSlider ? cs(thumbSlider).marginTop : null,
      infoPadTop: infoWrap ? cs(infoWrap).paddingTop : null,
      infoInlinePadTop: infoWrap ? infoWrap.style.paddingTop : null,
      infoClasses: infoWrap ? infoWrap.className : null,
      productClasses: q('.product') ? q('.product').className : null,
      productInfoExists: !!q('product-info'),
      rootFontSize: cs(document.documentElement).fontSize,
      titleMt: title ? cs(title).marginTop : null,
      titleInlineMt: title ? title.style.marginTop : null,
      gaps: {
        mainToThumb:
          mediaList && thumbList
            ? Math.round(thumbList.getBoundingClientRect().top - mediaList.getBoundingClientRect().bottom)
            : null,
        thumbToTitle:
          thumbList && title
            ? Math.round(title.getBoundingClientRect().top - thumbList.getBoundingClientRect().bottom)
            : null,
      },
      titleIndex: title ? Array.from(title.parentElement.children).indexOf(title) : null,
      firstChildClass: title?.parentElement?.firstElementChild?.className?.slice(0, 120) || null,
      matchingRules,
    };
  }, label);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  console.log(JSON.stringify(await snap(page, 'dcl'), null, 2));
  await page.waitForLoadState('load').catch(() => {});
  console.log(JSON.stringify(await snap(page, 'load'), null, 2));
  await page.waitForTimeout(8000);
  console.log(JSON.stringify(await snap(page, 'settle8s'), null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
