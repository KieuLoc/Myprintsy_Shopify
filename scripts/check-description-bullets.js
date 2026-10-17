/**
 * Description bullets sit on the same line as the text.
 *   node scripts/check-description-bullets.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const THEME = '186878558524';
const url =
  'https://www.myprintsy.com/products/ivory-merry-go-round-quilted-christmas-tree-skirt-ncu0hh1165?preview_theme_id=' +
  THEME;

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent =
      '.cart-reminder-popup,.success-opt-in-popup,#PBarNextFrameWrapper,#shopify-pc__banner,.shopify-pc__banner__dialog{display:none!important;pointer-events:none!important}';
    document.documentElement.appendChild(style);
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const summary = page.locator('.product__accordion summary', { hasText: 'Description' });
  await summary.click();
  await page.waitForSelector('.product__description li', { timeout: 15000 });

  const rows = await page.evaluate(() => {
    const box = document.querySelector('.product__description').getBoundingClientRect();
    return [...document.querySelectorAll('.product__description li')].map((li) => {
      const paragraph = li.querySelector(':scope > p');
      const liTop = li.getBoundingClientRect().top;
      const textBox = paragraph ? paragraph.getBoundingClientRect() : li.getBoundingClientRect();
      return {
        text: li.innerText.replace(/\s+/g, ' ').trim().slice(0, 48),
        gap: Math.round(textBox.top - liTop),
        indent: Math.round(textBox.left - box.left),
      };
    });
  });

  assert.ok(rows.length >= 4, `cần ít nhất 4 bullet, got ${rows.length}`);
  rows.forEach((row) => {
    assert.ok(row.gap < 8, `"${row.text}" lệch ${row.gap}px so với dấu chấm`);
    assert.ok(row.indent >= 12, `"${row.text}" sát mép ${row.indent}px, dấu chấm có thể bị cắt`);
  });

  await page.evaluate(() => {
    const description = document.querySelector('.product__description');
    document.querySelectorAll('body *').forEach((node) => {
      if (node.contains(description)) return;
      const style = window.getComputedStyle(node);
      if (style.position === 'fixed' || style.position === 'sticky') node.remove();
    });
  });
  await page.locator('.product__description').screenshot({
    path: 'scripts/description-bullets.png',
  });
  await browser.close();
  console.log('OK', rows);
})().catch((error) => {
  console.error('FAIL:', error.message);
  process.exit(1);
});
