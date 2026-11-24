/**
 * Welcome Step2 desktop+mobile CSS on theme: content panel burgundy #600a12 (not cream).
 *   THEME=183186358588 node scripts/check-welcome-step2-panel.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '183186358588';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(
    `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}&v=${Date.now()}`,
    { waitUntil: 'domcontentloaded', timeout: 60000 }
  );
  await page.waitForTimeout(1500);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll('link[rel=stylesheet]')]
      .map((l) => l.href)
      .filter((h) => /welcome-step2/.test(h))
  );
  assert.ok(hrefs.length >= 2, `step2 css links ${hrefs.length}`);
  for (const href of hrefs) {
    const text = await (await page.request.get(href)).text();
    const kind = /mobile/.test(href) ? 'mobile' : 'desktop';
    assert.ok(/#600a12/i.test(text), `${kind} has #600a12`);
    assert.ok(
      /welcome-step2__content[\s\S]{0,80}#600a12/i.test(text) ||
        /content--has-bg[\s\S]{0,80}#600a12/i.test(text),
      `${kind} content panel burgundy`
    );
    assert.ok(
      !/welcome-step2__content[^\{]*\{[^}]*background(?:-color)?:\s*#fff9ee/i.test(text),
      `${kind} content not cream #fff9ee`
    );
    console.log('ok', kind, text.length);
  }
  console.log('PASS theme', THEME);
  await browser.close();
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
