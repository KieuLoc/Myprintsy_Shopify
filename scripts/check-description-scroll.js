/**
 * Clicking Description on a short desktop screen must scroll the opened text into view.
 * On a tall screen, where the text is already readable, the page must stay put.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = process.env.THEME || '186878558524';
const URL =
  'https://myprintsy-3.myshopify.com/products/northwoods-bear-nook-christmas-quilted-tree-skirt-ncu0th3604?variant=67676987982140&preview_theme_id=' +
  THEME;

const HIDE = `
const s = document.createElement('style');
s.textContent = 'welcome-popup,welcome-step2-popup,.cart-reminder-popup,.success-opt-in-popup,.shopify-pc__banner{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

async function openProduct(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.addInitScript(HIDE);
  await page.route('**/ip-blocker-embed*', (route) => route.abort());
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('.product__accordion summary', { timeout: 30000 });
  await page.waitForTimeout(800);
  return page;
}

async function descriptionBox(page) {
  return page.evaluate(() => {
    const details = [...document.querySelectorAll('.product__accordion details')].find((el) =>
      /description/i.test(el.querySelector('.accordion__title')?.textContent || '')
    );
    const content = details?.querySelector('.accordion__content');
    const rect = content?.getBoundingClientRect();
    const visible = rect ? Math.round(Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0)) : 0;
    return {
      open: !!details?.open,
      visible,
      top: rect ? Math.round(rect.top) : null,
      scrollY: Math.round(window.scrollY),
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  try {
    const page = await openProduct(browser, 1280, 720);
    const summary = page.locator('.product__accordion summary', { hasText: 'Description' }).first();
    const t0 = Date.now();
    await summary.click();
    await page.waitForFunction(
      () => {
        const details = [...document.querySelectorAll('.product__accordion details')].find((el) =>
          /description/i.test(el.querySelector('.accordion__title')?.textContent || '')
        );
        const rect = details?.querySelector('.accordion__content')?.getBoundingClientRect();
        if (!rect) return false;
        return Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0) >= 160;
      },
      { timeout: 2500 }
    );
    const ms = Date.now() - t0;
    const box = await descriptionBox(page);
    assert.ok(box.open, 'Description không mở');
    assert.ok(box.visible >= 160, `màn 720px chỉ thấy ${box.visible}px chữ, top=${box.top}`);
    assert.ok(ms < 2000, `cuộn mất ${ms}ms`);
    console.log(`PASS màn thấp: thấy ${box.visible}px sau ${ms}ms, scrollY=${box.scrollY}`);
    await page.close();
  } catch (error) {
    failed += 1;
    console.log('FAIL màn thấp: ' + error.message.split('\n')[0]);
  }

  try {
    const page = await openProduct(browser, 1440, 1200);
    const before = await page.evaluate(() => window.scrollY);
    await page.locator('.product__accordion summary', { hasText: 'Description' }).first().click();
    await page.waitForTimeout(900);
    const box = await descriptionBox(page);
    const moved = box.scrollY - Math.round(before);
    assert.ok(box.open, 'Description không mở trên màn cao');
    assert.ok(box.visible >= 160, `màn cao chỉ thấy ${box.visible}px`);
    assert.ok(moved < 40, `màn cao tự cuộn ${moved}px dù chữ đã hiện`);
    console.log(`PASS màn cao: thấy ${box.visible}px, trang chỉ dịch ${moved}px`);
    await page.close();
  } catch (error) {
    failed += 1;
    console.log('FAIL màn cao: ' + error.message.split('\n')[0]);
  }

  await browser.close();
  process.exit(failed ? 1 : 0);
})();
