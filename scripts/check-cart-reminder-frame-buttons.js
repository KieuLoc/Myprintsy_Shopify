/**
 * GUI: CR desktop — khung chỉ nửa phải (.content) + CTA border = email (#b28a12).
 * Mobile: không assert khung dialog (burgundy panel, border 0).
 *   node scripts/check-cart-reminder-frame-buttons.js
 */
const assert = require('assert');
const { chromium } = require('playwright');

const THEME = process.env.THEME || '186878558524';
const URL = `https://myprintsy-3.myshopify.com/?preview_theme_id=${THEME}`;

function rgbClose(label, cssColor, r, g, b, tol = 30) {
  const m = String(cssColor).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assert.ok(m, `${label}: parse ${cssColor}`);
  assert.ok(
    Math.abs(+m[1] - r) <= tol && Math.abs(+m[2] - g) <= tol && Math.abs(+m[3] - b) <= tol,
    `${label}: ${cssColor} ~ rgb(${r},${g},${b})`
  );
}

async function openAndWaitKlaviyo(page) {
  await page.evaluate(async () => {
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    for (const k of ['welcome-popup', 'cart-reminder-popup']) {
      localStorage.removeItem(k);
      sessionStorage.removeItem(`${k}-session-shown`);
    }
    sessionStorage.setItem('welcome-popup-session-shown', '1');
    el.dataset.enabled = 'true';
    el.cartCount = 0;
    await el.refreshCartItems();
    el.modal.classList.add('is-open');
  });

  await page.waitForFunction(
    () => {
      const el = [...document.querySelectorAll('cart-reminder-popup')].find(
        (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
      );
      const btns = [...(el?.querySelectorAll('button.klaviyo-form-button') || [])];
      return btns.length >= 2;
    },
    null,
    { timeout: 20000 }
  );

  await page.evaluate(() => {
    document.querySelectorAll('#shopify-pc__banner,[id*=cookie]').forEach((n) => n.remove());
  });

  return page.evaluate(() => {
    const el = [...document.querySelectorAll('cart-reminder-popup')].find(
      (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
    );
    const dialog = el.querySelector('.cart-reminder-popup__dialog');
    const content = el.querySelector('.cart-reminder-popup__content');
    const media = el.querySelector('.cart-reminder-popup__media');
    const primary = el.querySelector(
      '[data-testid="form-row"]:nth-child(2) button.klaviyo-form-button'
    );
    const secondary = el.querySelector(
      '[data-testid="form-row"]:nth-child(3) button.klaviyo-form-button'
    );
    const email =
      el.querySelector(
        '.cart-reminder-popup__klaviyo-embed--replaces-email input[type="email"],' +
          '.cart-reminder-popup__klaviyo-embed--replaces-email input[name="email"]'
      ) || null;
    const dCs = getComputedStyle(dialog);
    const cCs = getComputedStyle(content);
    const after = getComputedStyle(content, '::after');
    const pCs = getComputedStyle(primary);
    const sCs = getComputedStyle(secondary);
    const eCs = email ? getComputedStyle(email) : null;
    const dr = dialog.getBoundingClientRect();
    const mr = media ? media.getBoundingClientRect() : null;
    const cr = content.getBoundingClientRect();
    return {
      dialogBorderW: dCs.borderTopWidth,
      dialogPad: dCs.paddingTop,
      contentBorder: cCs.borderTopColor,
      contentBorderW: cCs.borderTopWidth,
      afterContent: after.content,
      afterBorderW: after.borderTopWidth,
      mediaFlushLeft: mr ? Math.abs(mr.left - dr.left) < 3 : null,
      contentNotFullWidth: cr.width < dr.width * 0.7,
      primaryText: primary.textContent.trim(),
      primaryBg: pCs.backgroundColor,
      primaryColor: pCs.color,
      primaryBorder: pCs.borderTopColor,
      primaryBorderW: pCs.borderTopWidth,
      primaryRadius: pCs.borderTopLeftRadius,
      secondaryText: secondary.textContent.trim(),
      secondaryBorder: sCs.borderTopColor,
      secondaryBorderW: sCs.borderTopWidth,
      secondaryColor: sCs.color,
      secondaryRadius: sCs.borderTopLeftRadius,
      emailBorder: eCs ? eCs.borderTopColor : null,
      emailBorderW: eCs ? eCs.borderTopWidth : null,
      emailRadius: eCs ? eCs.borderTopLeftRadius : null,
      emailW: email ? +email.getBoundingClientRect().width.toFixed(1) : null,
      primaryW: +primary.getBoundingClientRect().width.toFixed(1),
      secondaryW: +secondary.getBoundingClientRect().width.toFixed(1),
    };
  });
}

async function check(browser, name, viewport) {
  const ctx = await browser.newContext({ viewport });
  const page = await ctx.newPage();
  await page.goto(`${URL}&v=${Date.now()}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => customElements.get('cart-reminder-popup'), null, {
    timeout: 30000,
  });
  const data = await openAndWaitKlaviyo(page);

  assert.ok(/get it now/i.test(data.primaryText), `${name} primary text ${data.primaryText}`);
  rgbClose(`${name} Get It Now bg`, data.primaryBg, 197, 157, 70);
  rgbClose(`${name} Get It Now text`, data.primaryColor, 17, 17, 17);
  assert.ok(/maybe later/i.test(data.secondaryText), `${name} secondary ${data.secondaryText}`);
  assert.ok(parseFloat(data.secondaryBorderW) >= 1, `${name} Maybe Later border`);

  if (name === 'desktop') {
    assert.ok(parseFloat(data.dialogBorderW) === 0, `${name} dialog NO outer frame`);
    assert.ok(parseFloat(data.dialogPad) === 0, `${name} dialog NO padding frame`);
    assert.ok(data.mediaFlushLeft, `${name} media flush left (frame not on whole dialog)`);
    assert.ok(data.contentNotFullWidth, `${name} content is right half`);
    assert.ok(parseFloat(data.contentBorderW) >= 1, `${name} content outer border ${data.contentBorderW}`);
    rgbClose(`${name} content frame gold`, data.contentBorder, 197, 157, 70);
    assert.ok(data.afterContent && data.afterContent !== 'none', `${name} content ::after`);
    assert.ok(parseFloat(data.afterBorderW) >= 1, `${name} content inner frame`);
    assert.ok(parseFloat(data.contentBorderW) <= 1.5, `${name} outer frame thin ${data.contentBorderW}`);

    assert.ok(parseFloat(data.primaryBorderW) >= 1, `${name} Get It Now borderW ${data.primaryBorderW}`);
    assert.ok(parseFloat(data.secondaryBorderW) >= 1, `${name} Maybe Later borderW`);
    rgbClose(`${name} Get It Now border`, data.primaryBorder, 178, 138, 18);
    rgbClose(`${name} Maybe Later border`, data.secondaryBorder, 178, 138, 18);
    // LIVE Klaviyo email = 15px — DEV phải khớp
    assert.ok(parseFloat(data.emailRadius) >= 14, `${name} email radius LIVE-match ${data.emailRadius}`);
    assert.ok(parseFloat(data.primaryRadius) >= 14, `${name} Get It Now rounded ${data.primaryRadius}`);
    assert.ok(parseFloat(data.secondaryRadius) >= 14, `${name} Maybe Later rounded ${data.secondaryRadius}`);
    assert.ok(
      Math.abs(parseFloat(data.primaryRadius) - parseFloat(data.emailRadius)) < 1,
      `${name} primary radius = email`
    );
    assert.ok(
      Math.abs(parseFloat(data.secondaryRadius) - parseFloat(data.emailRadius)) < 1,
      `${name} secondary radius = email`
    );
    assert.ok(
      data.emailW && Math.abs(data.primaryW - data.emailW) <= 6,
      `${name} primaryW ${data.primaryW} ~ emailW ${data.emailW}`
    );
    assert.ok(
      data.emailW && Math.abs(data.secondaryW - data.emailW) <= 6,
      `${name} secondaryW ${data.secondaryW} ~ emailW ${data.emailW}`
    );

    if (data.emailBorder && parseFloat(data.emailBorderW) >= 1) {
      rgbClose(`${name} email border`, data.emailBorder, 178, 138, 18);
      const e = String(data.emailBorder).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const p = String(data.primaryBorder).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const s = String(data.secondaryBorder).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const near = (a, b) =>
        Math.abs(+a[1] - +b[1]) <= 25 &&
        Math.abs(+a[2] - +b[2]) <= 25 &&
        Math.abs(+a[3] - +b[3]) <= 25;
      assert.ok(near(e, p), `${name} primary~email ${data.primaryBorder} vs ${data.emailBorder}`);
      assert.ok(near(e, s), `${name} secondary~email ${data.secondaryBorder} vs ${data.emailBorder}`);
    }

    // Crop CTAs — visual proof
    const boxes = await page.evaluate(() => {
      const el = [...document.querySelectorAll('cart-reminder-popup')].find(
        (c) => c.dataset.storageKey !== 'welcome-popup' && c.matchesDeviceTarget()
      );
      const box = (n) => {
        const r = n.getBoundingClientRect();
        return { x: r.x - 2, y: r.y - 2, width: r.width + 4, height: r.height + 4 };
      };
      return {
        primary: box(
          el.querySelector('[data-testid="form-row"]:nth-child(2) button.klaviyo-form-button')
        ),
        secondary: box(
          el.querySelector('[data-testid="form-row"]:nth-child(3) button.klaviyo-form-button')
        ),
        content: box(el.querySelector('.cart-reminder-popup__content')),
      };
    });
    await page.screenshot({
      path: 'scripts/_shots/cr-btn-primary.png',
      clip: boxes.primary,
    });
    await page.screenshot({
      path: 'scripts/_shots/cr-btn-secondary.png',
      clip: boxes.secondary,
    });
    await page.screenshot({
      path: 'scripts/_shots/cr-content-frame.png',
      clip: boxes.content,
    });
  }

  await page.screenshot({ path: `scripts/_shots/cart-reminder-frame-${name}.png` });
  await ctx.close();
  return data;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const d = await check(browser, 'desktop', { width: 1366, height: 900 });
    const m = await check(browser, 'mobile', { width: 390, height: 844 });
    console.log(
      'PASS desktop',
      'contentBorder=' + d.contentBorder,
      'primaryBorder=' + d.primaryBorder,
      'secondaryBorder=' + d.secondaryBorder,
      'emailBorder=' + d.emailBorder
    );
    console.log('PASS mobile', m.primaryBg, m.secondaryBorder);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
