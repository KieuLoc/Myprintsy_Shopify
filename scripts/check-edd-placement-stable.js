/**
 * EDD placement: stable + right under Buy More Save More when present.
 *
 *   node scripts/check-edd-placement-stable.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const URL =
  'https://www.myprintsy.com/products/cat-rainbow-personalized-shirt?preview_theme_id=186878558524&variant=52620429689148';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  try {
    await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForSelector('.product__info-container .bmsm', { timeout: 30000 });
    await page.waitForSelector(
      '.product__info-container .sb_ETA, .product__info-container .custom_delivery_estimation_widget',
      { timeout: 30000 }
    );
    await page.waitForTimeout(3500);

    const result = await page.evaluate(async () => {
      const out = [];
      for (let i = 0; i < 20; i++) {
        const variant = document.querySelector('.product__info-container variant-selects');
        const prev = variant?.previousElementSibling;
        out.push({
          id: prev
            ? prev.getAttribute('class') + '|' + (prev.querySelector?.('.sb_ETA') ? 'eta' : 'noeta')
            : null,
        });
        await new Promise((r) => setTimeout(r, 100));
      }
      const firstPrev = out[0]?.id;
      let flips = 0;
      let last = firstPrev;
      for (const s of out) {
        if (s.id !== last) {
          flips += 1;
          last = s.id;
        }
      }

      const bmsm = document.querySelector('.product__info-container .bmsm');
      const slot =
        document.querySelector(
          '.product__info-container .custom_delivery_estimation_widget[data-myprintsy-edd-slot]'
        ) || document.querySelector('.product__info-container .custom_delivery_estimation_widget');
      const eta =
        document.querySelector('.product__info-container .sb_ETA') || slot?.querySelector('.sb_ETA');
      const box = eta?.querySelector('.sb_delivery, .deliverydate') || eta || slot;
      const br = bmsm.getBoundingClientRect();
      const er = box.getBoundingClientRect();
      return {
        flips,
        stablePrev: out.every((s) => s.id === firstPrev),
        hasBmsm: !!bmsm,
        slotRightAfterBmsm: !!(bmsm && slot && bmsm.nextElementSibling === slot),
        gapPx: Math.round(er.top - br.bottom),
      };
    });

    console.log(JSON.stringify(result, null, 2));
    assert.ok(result.hasBmsm, 'bmsm missing');
    assert.ok(result.slotRightAfterBmsm, 'EDD slot not immediately after .bmsm');
    assert.ok(result.flips <= 1, `sibling flipped ${result.flips} times (expected ≤1)`);
    assert.ok(result.stablePrev, 'previousSibling not stable for 2s');
    assert.ok(result.gapPx >= 6 && result.gapPx <= 10, `BMSM→EDD gap ${result.gapPx}px (expected ~8)`);
    console.log(`PASS: EDD under BMSM, gap ${result.gapPx}px, placement stable`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
