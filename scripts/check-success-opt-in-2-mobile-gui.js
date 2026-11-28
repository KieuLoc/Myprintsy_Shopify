/**
 * GUI: SOI1 mobile = centered xmas card; SOI2 mobile = same size, CR2 bottom-left.
 * Code centered in white box.
 *
 *   node scripts/check-success-opt-in-2-mobile-gui.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://www.myprintsy.com/?preview_theme_id=${THEME}`;

async function measure(page, variant) {
  return page.evaluate(async (v) => {
    const SuccessOptIn = window.SuccessOptInPopup || customElements.get('success-opt-in-popup');
    SuccessOptIn.open({ variant: v, promoCode: 'MERRY25' });
    const el = [...document.querySelectorAll('success-opt-in-popup')].find(
      (n) => (n.dataset.variant || '1') === v && n.dataset.deviceTarget === 'mobile'
    );
    if (!el) return { err: `no soi${v} mobile` };
    const modal = el.querySelector('.success-opt-in-popup--xmas');
    const dialog = el.querySelector('.success-opt-in-popup__dialog');
    const code = el.querySelector('.success-opt-in-popup__heading-prefix');
    const codeWrap = el.querySelector('.success-opt-in-popup__code-wrap');
    const heading = el.querySelector('.success-opt-in-popup__heading');
    const panel = el.querySelector('.success-opt-in-popup__panel');
    const dialogBox = dialog.getBoundingClientRect();
    const codeBox = code?.getBoundingClientRect();
    const wrapBox = codeWrap?.getBoundingClientRect();
    const panelCs = getComputedStyle(panel);
    const headingCs = getComputedStyle(heading);
    return {
      open: modal?.classList.contains('is-open'),
      code: code?.textContent.trim(),
      dialogL: Math.round(dialogBox.left),
      dialogR: Math.round(dialogBox.right),
      dialogB: Math.round(dialogBox.bottom),
      dialogT: Math.round(dialogBox.top),
      dialogW: Math.round(dialogBox.width),
      dialogH: Math.round(dialogBox.height),
      vw: window.innerWidth,
      vh: window.innerHeight,
      panelBg: panelCs.backgroundColor,
      headingAlign: headingCs.textAlign,
      codeCenterDelta:
        codeBox && wrapBox
          ? Math.abs((codeBox.left + codeBox.right) / 2 - (wrapBox.left + wrapBox.right) / 2)
          : 999,
    };
  }, variant);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('success-opt-in-popup'), null, {
    timeout: 30000,
  });
  await page.waitForTimeout(1200);

  const soi1 = await measure(page, '1');
  await page.evaluate(() => {
    document.querySelectorAll('success-opt-in-popup').forEach((n) => n.close?.());
  });
  await page.waitForTimeout(200);
  const soi2 = await measure(page, '2');
  await browser.close();

  assert.ok(!soi1.err, soi1.err);
  assert.ok(soi1.open, 'SOI1 not open');
  assert.ok(/merry25/i.test(soi1.code || ''), `SOI1 code ${soi1.code}`);
  assert.ok(soi1.headingAlign === 'center', `SOI1 code align ${soi1.headingAlign}`);
  assert.ok(soi1.codeCenterDelta < 12, `SOI1 code not centered Δ=${soi1.codeCenterDelta}`);
  const soi1Mid = (soi1.dialogL + soi1.dialogR) / 2;
  assert.ok(Math.abs(soi1Mid - soi1.vw / 2) < 24, `SOI1 not centered mid=${soi1Mid}`);
  const rgb1 = String(soi1.panelBg).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(rgb1 && +rgb1[1] > 80 && +rgb1[1] < 140 && +rgb1[2] < 50, soi1.panelBg);

  assert.ok(!soi2.err, soi2.err);
  assert.ok(soi2.open, 'SOI2 not open');
  assert.ok(/merry25/i.test(soi2.code || ''), `SOI2 code ${soi2.code}`);
  assert.ok(soi2.headingAlign === 'center', `SOI2 code align ${soi2.headingAlign}`);
  assert.ok(soi2.codeCenterDelta < 12, `SOI2 code not centered Δ=${soi2.codeCenterDelta}`);
  assert.ok(soi2.dialogL < 28, `SOI2 not left-aligned L=${soi2.dialogL}`);
  assert.ok(soi2.vh - soi2.dialogB < 40, `SOI2 not bottom-aligned gap=${soi2.vh - soi2.dialogB}`);
  const cr2Width = Math.min(((soi2.vw - 20) * 2) / 3, 280);
  assert.ok(
    Math.abs(soi2.dialogW - cr2Width) < 18,
    `SOI2 width ${soi2.dialogW} != CR2~${Math.round(cr2Width)}`
  );
  assert.ok(soi2.dialogW < soi1.dialogW - 40, `SOI2 should be smaller than SOI1 (${soi2.dialogW} vs ${soi1.dialogW})`);

  console.log('OK — SOI1 center + SOI2 CR2 size', {
    soi1: `${soi1.dialogW}x${soi1.dialogH} midΔ=${Math.round(Math.abs(soi1Mid - soi1.vw / 2))} codeΔ=${soi1.codeCenterDelta.toFixed(1)}`,
    soi2: `${soi2.dialogW}x${soi2.dialogH} L=${soi2.dialogL} bottomGap=${soi2.vh - soi2.dialogB} ~CR2=${Math.round(cr2Width)}`,
  });
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
