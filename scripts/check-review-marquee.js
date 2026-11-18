/**
 * Homepage review marquee: 10 newest Judge.me reviews, product image, @reviewer.
 * A second load blocks the Judge.me feed and the section must stay hidden.
 *
 *   node scripts/check-review-marquee.js
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';
const URL = `${BASE}/?preview_theme_id=${THEME}`;
const SHOP = 'sqj5k3-d1.myshopify.com';

function namesFromHtml(html, limit) {
  const names = [];
  for (const chunk of String(html).split("data-review-id=").slice(1)) {
    const author = chunk.match(/class='jdgm-rev__author'>([^<]+)/);
    if (!author) continue;
    names.push('@' + author[1].trim());
    if (names.length >= limit) break;
  }
  return names;
}

async function readCards(page) {
  return page.evaluate(() => {
    const root = document.querySelector('[data-review-marquee]');
    if (!root) return null;
    const group = root.querySelector('.image-marquee__group:not([data-marquee-clone])');
    const rowCards = (row) =>
      [...(group ? group.querySelectorAll('.image-marquee__row--' + row + ' .image-marquee__card:not(.image-marquee__card--pad)') : [])];
    const top = rowCards('top');
    const bottom = rowCards('bottom');
    const cards = [];
    for (let i = 0; i < Math.max(top.length, bottom.length); i++) {
      if (top[i]) cards.push(top[i]);
      if (bottom[i]) cards.push(bottom[i]);
    }
    return {
      hidden: root.hidden,
      count: cards.length,
      captions: cards.map((card) => card.querySelector('.image-marquee__caption')?.textContent.trim() || ''),
      links: cards.map((card) => card.querySelector('a')?.getAttribute('href') || ''),
      loaded: cards.filter((card) => {
        const img = card.querySelector('img');
        return img && img.complete && img.naturalWidth > 0;
      }).length,
      manual: document.querySelectorAll('.image-marquee-section:not([data-review-marquee]) .image-marquee').length,
    };
  });
}

(async () => {
  const feed = await fetch(
    'https://cdn.judge.me/reviews/all_reviews_js_based?platform=shopify&shop_domain=' + SHOP
  );
  const expected = namesFromHtml((await feed.json()).html, 10);
  assert.strictEqual(expected.length, 10, `feed returned ${expected.length} names`);

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-review-marquee]');
      return root && !root.hidden && root.querySelector('.image-marquee__card');
    },
    { timeout: 20000 }
  );
  await page.locator('[data-review-marquee]').scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll('[data-review-marquee] .image-marquee__group:not([data-marquee-clone]) img')].filter(
        (img) => img.complete && img.naturalWidth > 0
      ).length >= 8,
    { timeout: 15000 }
  );
  const shown = await readCards(page);
  console.log('show', shown);

  const failPage = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await failPage.route('**/all_reviews_js_based*', (route) => route.abort());
  await failPage.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await failPage.waitForTimeout(4000);
  const hidden = await readCards(failPage);
  console.log('blocked', hidden);
  await browser.close();

  assert.strictEqual(shown.count, 10, `cards ${shown.count}`);
  assert.deepStrictEqual(shown.captions, expected, `captions ${shown.captions.join(', ')}`);
  assert.ok(shown.links.every((href) => href.includes('/products/')), `links ${shown.links.join(', ')}`);
  assert.ok(shown.loaded >= 8, `images painted ${shown.loaded}/10`);
  assert.strictEqual(shown.manual, 0, `manual marquee still visible (${shown.manual})`);
  assert.strictEqual(hidden.hidden, true, 'blocked feed still showed the review marquee');
  assert.strictEqual(hidden.count, 0, `blocked feed rendered ${hidden.count} cards`);
  assert.strictEqual(hidden.manual, 0, `manual marquee visible while reviews are blocked (${hidden.manual})`);
  console.log(`PASS review marquee: 10 cards ${expected[0]} … ${expected[9]}, blocked feed stays hidden`);
})().catch((error) => {
  console.error('FAIL', error.message);
  process.exit(1);
});
