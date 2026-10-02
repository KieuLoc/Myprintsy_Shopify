/**
 * Dump Judge.me revamp widget DOM (new class names).
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const URL =
  process.argv[2] ||
  'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-accent-mug-travelling-tumbler-upthah2e13?preview_theme_id=186878558524';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });

  for (let i = 0; i < 50; i++) {
    const ready = await page.evaluate(() => {
      const w = document.querySelector('#judgeme_product_reviews');
      if (!w) return false;
      return (
        w.innerText.includes('Customer Reviews') ||
        w.innerText.includes('Karen') ||
        w.querySelectorAll('*').length > 20
      );
    });
    if (ready) break;
    await page.waitForTimeout(400);
  }

  await page.evaluate(() => {
    const el = document.querySelector('#judgeme_product_reviews');
    if (el) el.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    const w = document.querySelector('#judgeme_product_reviews');
    if (!w) return { err: 'no widget' };

    const classes = [...w.querySelectorAll('*')]
      .map((el) => el.className.toString())
      .filter(Boolean);
    const uniq = [...new Set(classes)].slice(0, 150);

    const reviewCandidates = [
      ...w.querySelectorAll('[class*="review"], [class*="rev"], [class*="card"], [class*="item"]'),
    ]
      .filter(
        (el) =>
          /Karen|Amanda|Monroe/.test(el.textContent || '') && el.children.length > 0
      )
      .slice(0, 20)
      .map((el) => {
        const cs = getComputedStyle(el);
        return {
          cls: el.className.toString().slice(0, 120),
          tag: el.tagName,
          mt: cs.marginTop,
          mb: cs.marginBottom,
          pt: cs.paddingTop,
          pb: cs.paddingBottom,
          h: Math.round(el.getBoundingClientRect().height),
          text: (el.textContent || '').replace(/\s+/g, ' ').slice(0, 90),
        };
      });

    // Measure gaps between reviewer blocks
    const nameNodes = [...w.querySelectorAll('*')].filter((el) =>
      /^(Karen|Amanda|Monroe)$/.test((el.textContent || '').trim())
    );
    const gaps = [];
    for (let i = 0; i < nameNodes.length - 1; i++) {
      let a = nameNodes[i];
      let b = nameNodes[i + 1];
      // climb to similar depth containers
      while (a.parentElement && b.parentElement && a.parentElement !== b.parentElement) {
        if (a.parentElement.contains(b)) b = b.parentElement;
        else if (b.parentElement.contains(a)) a = a.parentElement;
        else {
          a = a.parentElement;
          b = b.parentElement;
        }
      }
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      gaps.push({
        from: nameNodes[i].textContent.trim(),
        to: nameNodes[i + 1].textContent.trim(),
        gapPx: Math.round(br.top - ar.bottom),
        aCls: a.className.toString().slice(0, 80),
        aPad: getComputedStyle(a).paddingTop + '/' + getComputedStyle(a).paddingBottom,
        aMar: getComputedStyle(a).marginTop + '/' + getComputedStyle(a).marginBottom,
        aH: Math.round(ar.height),
      });
    }

    return {
      widgetClasses: w.className,
      childCount: w.children.length,
      textStart: (w.innerText || '').slice(0, 500),
      uniqClasses: uniq,
      reviewCandidates,
      gaps,
      html: w.innerHTML.slice(0, 8000),
    };
  });

  const out = path.join(__dirname, '..', 'debug-jdgm-revamp.json');
  fs.writeFileSync(out, JSON.stringify(data, null, 2));
  console.log('wrote', out);
  console.log('widgetClasses', data.widgetClasses);
  console.log('childCount', data.childCount);
  console.log('textStart', data.textStart);
  console.log('uniq sample', (data.uniqClasses || []).slice(0, 80));
  console.log('gaps', JSON.stringify(data.gaps, null, 2));
  console.log('candidates count', (data.reviewCandidates || []).length);
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
