/**
 * Check: Size Guide (cloak table) shows for Cloak / Ultra Cloak / Jogger / Bomber Jacket / Zip Hoodie / Ugly Sweater / Robes,
 * opens on click, closes on Esc; other types (Mug, T-Shirt, Wearable Blanket Hoodie) have no opener.
 */
const { chromium } = require('playwright');
const assert = require('assert');

const BASE = 'https://myprintsy-3.myshopify.com';
const THEME = process.env.THEME || '186878558524';

const SHOW = {
  'Ultra Cloak': 'kitsune-ultra-cloak-1010',
  'hoodie 3d': 'siren-hoodie-1420',
  Jogger: 'kitsune-joggers-1653',
  'Bomber Jacket': 'ogham-bomber-jacket-926',
  'Zip Hoodie': 'dragon-luna-zip-hoodie-1150',
  Cloak: 'yggdrasil-cloak-218',
  'Ugly Sweater': 'f-caw-f-crow-joke-personalized-unisex-ugly-sweater',
  Robes: 'ryu-robe',
  Legging: 'ghost-oath-leggings',
  'Hawaii Shirt': 'hawaii-hawaiian-shirt-parrot',
};
const IMG = { 'Ugly Sweater': 'size-guide-sweater', Robes: 'size-guide-robe' };
const FIT = {
  'Ultra Cloak': 'Please note that our size guide is approximate.',
  'hoodie 3d': 'Myprintsy Pullover Hoodies fit true to size.',
  Jogger: 'Myprintsy Joggers are slim fit.',
  'Bomber Jacket': 'Myprintsy Bomber Jackets fit true to size.',
  'Zip Hoodie': 'Myprintsy Zip Hoodies fit true to size.',
  Cloak: 'Myprintsy Cloaks are tight fitting.',
  'Ugly Sweater': 'Myprintsy Sweaters fit true to size.',
  Robes: 'These are approximate size guidelines. Our Robes are made using a generous cut',
  Legging: 'Myprintsy Leggings are slim fit.',
  'Hawaii Shirt': 'Myprintsy Hawaiian Shirts fit true to size.',
};
const HIDE = {
  Mug: 'pickleball-lover-personalized-mug-pklaah2a03',
  'T-Shirt': 'put-the-lime-in-the-coconut-casual-hoodie',
  'Wearable Blanket Hoodie': 'cyber-hooded-blanket-limited-649',
};

const HIDE_OVERLAY = `
const s = document.createElement('style');
s.textContent = '.cart-reminder-popup,.success-opt-in-popup,welcome-popup,welcome-step2-popup{display:none!important;pointer-events:none!important}';
document.documentElement.appendChild(s);
`;

async function open(browser, handle) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  await page.addInitScript(HIDE_OVERLAY);
  await page.goto(`${BASE}/products/${handle}?preview_theme_id=${THEME}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(4000);
  return page;
}

(async () => {
  const browser = await chromium.launch();
  let failed = 0;
  const check = async (name, fn) => {
    try { await fn(); console.log(`PASS ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
  };

  for (const [type, handle] of Object.entries(SHOW)) {
    await check(`${type} shows size guide`, async () => {
      const page = await open(browser, handle);
      try {
        const opener = page.locator('.sgc-opener button').first();
        assert.ok(await opener.isVisible(), `${handle}: no visible Size Guide button`);
        const modal = page.locator('modal-dialog.size-guide-cloak');
        const t0 = Date.now();
        await opener.click();
        await page.waitForFunction(() => document.querySelector('modal-dialog.size-guide-cloak')?.hasAttribute('open'), null, { timeout: 3000 });
        const rows = await modal.locator('.sgc__table tbody tr').count();
        assert.ok(rows >= 5, `${handle}: size table has ${rows} rows`);
        console.log(`  ${handle}: modal open ${Date.now() - t0}ms, ${rows} rows`);
        const fit = (await modal.locator('.sgc__list li').first().innerText()).trim();
        assert.ok(fit.startsWith(FIT[type]), `${handle}: fit note "${fit}", want "${FIT[type]}…"`);
        assert.ok(!/lunafide/i.test(await modal.innerText()), `${handle}: modal mentions Lunafide`);
        const table = await modal.locator('.sgc__table').evaluate((t) => ({
          head: [...t.querySelectorAll('thead th')].map((th) => th.textContent.trim()).join(','),
          sizes: [...t.querySelectorAll('tbody th')].map((th) => th.textContent.trim()).join(','),
          cm: [...t.querySelectorAll('tbody tr')].map((tr) => [...tr.querySelectorAll('.sgc__cm')].map((s) => s.textContent.trim()).join('/')).join(','),
        }));
        const img = modal.locator('.sgc__howto img');
        await img.scrollIntoViewIfNeeded();
        await page.waitForFunction((m) => m.querySelector('.sgc__howto img')?.complete, await modal.elementHandle(), { timeout: 5000 });
        const { src, nw } = await img.evaluate((i) => ({ src: i.currentSrc || i.src, nw: i.naturalWidth }));
        const wantImg = IMG[type] || 'size-guide-' + type.toLowerCase().replace(/ /g, '-');
        assert.ok(src.includes(wantImg), `${handle}: howto img ${src}, want ${wantImg}`);
        assert.ok(nw > 0, `${handle}: howto img not loaded (naturalWidth ${nw})`);
        if (type === 'Ultra Cloak') {
          const notes = (await modal.locator('.sgc__list li').allInnerTexts()).map((s) => s.trim());
          assert.strictEqual(notes.length, 3, `ultra notes: ${notes.length} bullets`);
          assert.strictEqual(notes[1], 'Our Ultra Cloaks feature a loose and oversized fit.', `ultra note 2: "${notes[1]}"`);
          assert.ok(notes[2].includes('Side Seam to Side Seam'), `ultra note 3: "${notes[2]}"`);
          assert.strictEqual(table.head, 'SIZE,CHEST,FULL SLEEVE,SLEEVE CUFFED,LENGTH', `ultra head: ${table.head}`);
          assert.strictEqual(table.sizes, 'XS,S,M,L,XL,2XL,3XL,4XL,5XL', `ultra sizes: ${table.sizes}`);
          assert.strictEqual(table.cm, '55.9/74.9/67.3/99.1,58.4/76.2/68.6/102,61/77.5/69.8/104,63.5/78.7/71.1/107,66/80/72.4/109,68.6/81.3/73.7/112,71.1/82.5/74.9/114,73.7/83.8/76.2/117,76.2/85.1/77.5/119', `ultra cm: ${table.cm}`);
        } else if (type === 'Zip Hoodie' || type === 'hoodie 3d') {
          assert.strictEqual(table.head, 'SIZE,LENGTH,CHEST', `zip head: ${table.head}`);
          assert.strictEqual(table.sizes, 'S,M,L,XL,2XL,3XL,4XL,5XL', `zip sizes: ${table.sizes}`);
          assert.strictEqual(table.cm, '70.9/107,72.1/111,74.9/115,76.2/120,77.5/125,80/130,81.3/136,82.5/141', `zip cm: ${table.cm}`);
        } else if (type === 'Ugly Sweater') {
          assert.strictEqual(table.head, 'SIZE,LENGTH,CHEST', `sweater head: ${table.head}`);
          assert.strictEqual(table.sizes, 'S,M,L,XL,2XL,3XL,4XL,5XL', `sweater sizes: ${table.sizes}`);
          assert.strictEqual(table.cm, '68.6/122,71.1/124,73.7/127,76.2/130,78.7/132,81.3/135,83.8/137,86.4/140', `sweater cm: ${table.cm}`);
          const cap = await modal.locator('.sgc__caption').innerText().catch(() => '');
          assert.strictEqual(cap, 'These Measurements are approximate', `sweater caption: "${cap}"`);
          await modal.locator('.sgc__unit--in').click();
          const inS = await modal.locator('.sgc__table tbody tr').first().locator('.sgc__in').allInnerTexts();
          assert.strictEqual(inS.join('/'), '27.0/48.0', `sweater S inches: ${inS.join('/')}`);
        } else if (type === 'Hawaii Shirt') {
          assert.strictEqual(table.head, 'SIZE,LENGTH,BUST,SHOULDER,SLEEVES', `hawaii head: ${table.head}`);
          assert.strictEqual(table.sizes, 'XS,S,M,L,XL,2XL,3XL,4XL,5XL,6XL', `hawaii sizes: ${table.sizes}`);
          await modal.locator('.sgc__unit--in').click();
          const ins = await modal.locator('.sgc__table tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.querySelectorAll('.sgc__in')].map((s) => s.textContent.trim()).join('/')));
          assert.strictEqual(ins[1], '29.9/48.8/21.5/9.1', `hawaii S inches: ${ins[1]}`);
          assert.strictEqual(ins[9], '36.2/67.7/27.8/12.2', `hawaii 6XL inches: ${ins[9]}`);
        } else if (type === 'Legging') {
          assert.strictEqual(table.head, 'SIZE,WAIST,HIP,INSEAM', `legging head: ${table.head}`);
          assert.strictEqual(table.sizes, 'XS,S,M,L,XL,2XL,3XL,4XL,5XL', `legging sizes: ${table.sizes}`);
          assert.ok(table.cm.endsWith('151 - 158/148 - 156/83.2'), `legging 5XL: ${table.cm}`);
          assert.ok(table.cm.startsWith('58.4 - 66/83.8 - 90.2/81.8,'), `legging XS cm: ${table.cm}`);
          const cap = await modal.locator('.sgc__caption').innerText().catch(() => '');
          assert.strictEqual(cap, 'Fabric Used for Leggings has a four-way stretch', `legging caption: "${cap}"`);
        } else if (type === 'Robes') {
          assert.strictEqual(table.head, 'SIZE,LENGTH (HPS),CHEST,SLEEVE,SLEEVE CIRC.,BELT LENGTH', `robe head: ${table.head}`);
          assert.strictEqual(table.sizes, 'M,L,XL,2XL,3XL,4XL,5XL', `robe sizes: ${table.sizes}`);
          assert.ok(table.cm.startsWith('127/66.7/57.8/15.2/185,132/73/58.4/15.9/198,132/76.2/58.8/16.2/204.5,132/79.4/59.1/16.5/211,'), `robe cm: ${table.cm}`);
          assert.ok(table.cm.endsWith('132/98.4/61/18.4/249'), `robe 5XL: ${table.cm}`);
          const n = await modal.locator('.sgc__list li').count();
          assert.strictEqual(n, 3, `robe notes: ${n} bullets`);
        } else if (type === 'Bomber Jacket') {
          assert.strictEqual(table.head, 'SIZE,LENGTH,CHEST,WAIST', `bomber head: ${table.head}`);
          assert.strictEqual(table.sizes, 'S,M,L,XL,2XL,3XL', `bomber sizes: ${table.sizes}`);
          assert.strictEqual(table.cm, '69.2/55.9/53.3,71.8/58.4/55.9,74.3/61/58.4,76.8/64.8/62.2,79.4/68.6/66,81.9/72.4/69.8', `bomber cm: ${table.cm}`);
        } else if (type === 'Jogger') {
          assert.strictEqual(table.head, 'SIZE,WAIST,INSEAM,RISE,OUTSEAM', `jogger head: ${table.head}`);
          assert.strictEqual(table.sizes, 'XS,S,M,L,XL,2XL,3XL,4XL,5XL', `jogger sizes: ${table.sizes}`);
          assert.ok(table.cm.startsWith('66 - 71.1/68.6/25.4/96.5,71.1 - 76.2/71.1/25.4/99.1,'), `jogger cm: ${table.cm}`);
          assert.ok(table.cm.endsWith('106.7 - 111.8/88.9/30.5/116.8'), `jogger 5XL: ${table.cm}`);
          await modal.locator('.sgc__unit--in').click();
          const inS = await modal.locator('.sgc__table tbody tr').nth(1).locator('.sgc__in').first().innerText();
          assert.strictEqual(inS, '28.0 - 30.0', `jogger S waist inches: ${inS}`);
        } else {
          assert.strictEqual(table.head, 'SIZE,CHEST,SLEEVE,SLEEVE CIRC.,LENGTH', `${handle} head: ${table.head}`);
        }
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        assert.ok(!(await modal.evaluate((m) => m.hasAttribute('open'))), `${handle}: modal still open after Esc`);
      } finally { await page.close(); }
    });
  }

  for (const [type, handle] of Object.entries(HIDE)) {
    await check(`${type} has no size guide`, async () => {
      const page = await open(browser, handle);
      try {
        const n = await page.locator('.sgc-opener, modal-dialog.size-guide-cloak').count();
        assert.strictEqual(n, 0, `${handle}: found ${n} size guide elements`);
      } finally { await page.close(); }
    });
  }

  await browser.close();
  process.exit(failed ? 1 : 0);
})();
