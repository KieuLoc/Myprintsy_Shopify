const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const url =
    'https://www.myprintsy.com/products/mediterranean-style-majolica-print-personalized-ceramic-plate-plates-for-decoration-upthah2e16';
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });

  // Unhide slots early and watch for ETA
  await page.addStyleTag({
    content:
      '.custom_delivery_estimation_widget{display:block!important;visibility:visible!important;min-height:1px!important;}',
  });

  const logs = [];
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    const snap = await page.evaluate(() => {
      const eta = document.querySelector('.sb_ETA');
      const slots = [...document.querySelectorAll('.custom_delivery_estimation_widget')];
      return {
        t: Date.now(),
        hasEta: !!eta,
        etaText: eta?.textContent?.trim().slice(0, 80) || null,
        slotHtml: slots.map((s) => s.innerHTML.length),
        delivered: document.body.innerText.includes('Delivered to'),
        infoExt: document.querySelector('.sb_info_extension')?.outerHTML?.slice(0, 200),
      };
    });
    logs.push(snap);
    if (snap.hasEta) break;
  }

  // Try manually ensuring slot is visible and after price
  await page.evaluate(() => {
    const info = document.querySelector('.product__info-container');
    const price = info?.querySelector('[id^="price-"]');
    const variant = info?.querySelector('variant-selects, variant-radios');
    let slot = info?.querySelector('.custom_delivery_estimation_widget');
    if (!slot && info) {
      slot = document.createElement('div');
      slot.className = 'custom_delivery_estimation_widget';
      info.appendChild(slot);
    }
    if (slot && variant) variant.parentNode.insertBefore(slot, variant);
    else if (slot && price) price.insertAdjacentElement('afterend', slot);
    if (slot) {
      slot.style.cssText = 'display:block!important;visibility:visible!important;min-height:20px;';
    }
    // Trigger common EDD refresh hooks if present
    if (typeof window.findSpecificEDDMsg === 'function') {
      try {
        window.findSpecificEDDMsg();
      } catch (e) {}
    }
    if (typeof window.edd_load === 'function') {
      try {
        window.edd_load();
      } catch (e) {}
    }
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });

  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => {
    const eta = document.querySelector('.sb_ETA');
    const keys = Object.keys(window).filter((k) => /edd|ETA|delivery|sb_/i.test(k)).slice(0, 40);
    return {
      hasEta: !!eta,
      delivered: document.body.innerText.includes('Delivered to'),
      etaText: eta?.textContent?.trim().slice(0, 100) || null,
      keys,
      slot: [...document.querySelectorAll('.custom_delivery_estimation_widget')].map((s) => ({
        display: getComputedStyle(s).display,
        html: s.innerHTML.slice(0, 200),
        htmlLen: s.innerHTML.length,
      })),
    };
  });

  console.log(JSON.stringify({ logs: logs.slice(-5), after }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
