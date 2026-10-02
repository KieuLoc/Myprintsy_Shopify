/**
 * Template: product.variant_link
 * When a variant has metafield custom.link_url to a different page, selecting it navigates there.
 * Mock/Type with byMock URL: intercept click BEFORE Dawn updates variant/URL so Back stays clean.
 * Same-product URLs do not redirect (keeps Size/Color/Pack selection working).
 */
(function () {
  const TEMPLATE_SUFFIX = 'variant_link';

  function normalizeUrl(rawUrl) {
    if (!rawUrl) return '';
    const trimmed = String(rawUrl).trim();
    if (!trimmed) return '';

    try {
      return new URL(trimmed, window.location.origin);
    } catch {
      return null;
    }
  }

  function pathKey(url) {
    if (!url) return '';
    return String(url.pathname || '').replace(/\/$/, '');
  }

  function getOptionControl(target) {
    if (!target) return null;
    if (target.tagName === 'OPTION') return target.closest('select');
    if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return target;
    return target.closest?.('input, select') || null;
  }

  /** True when shopper changed Type/mock (option position 1), not Handle Color. */
  function isMockOptionControl(control, config) {
    if (!control) return false;

    const name = String(control.getAttribute('name') || '').trim();
    if (!name) return false;

    const mockPos = String(config.mockOptionPosition || 1);
    const mockName = String(config.mockOptionName || '').trim();

    if (mockName && name === `options[${mockName}]`) return true;
    if (mockName && name.toLowerCase() === `${mockName.toLowerCase()}-${mockPos}`) return true;
    if (name.endsWith(`-${mockPos}`)) return true;

    return false;
  }

  function selectedOptionLabel(control, dataTarget) {
    if (dataTarget?.tagName === 'OPTION') {
      return String(dataTarget.value || dataTarget.textContent || '').trim();
    }
    if (control?.tagName === 'SELECT') {
      const opt = control.selectedOptions?.[0];
      return String(opt?.value || control.value || '').trim();
    }
    if (control) return String(control.value || '').trim();
    return '';
  }

  function mockValueFromVariant(variant) {
    if (!variant) return '';
    if (variant.option1) return String(variant.option1);
    if (Array.isArray(variant.options) && variant.options[0]) return String(variant.options[0]);
    return '';
  }

  function resolveRedirectUrl(config, variant, mockOptionChanged) {
    if (!variant?.id) return '';

    const byId = config.variants?.[String(variant.id)] || '';
    if (!mockOptionChanged) return byId;

    const mockValue = mockValueFromVariant(variant);
    const byMock = mockValue ? config.byMock?.[mockValue] || '' : '';
    return byMock || byId;
  }

  function canNavigate(rawUrl, currentHref) {
    const target = normalizeUrl(rawUrl);
    if (!target) return null;

    const current = normalizeUrl(currentHref || window.location.href);
    if (!current) return null;

    if (pathKey(target) === pathKey(current)) return null;
    if (target.href === current.href) return null;

    return target;
  }

  function tryNavigate(rawUrl, currentHref) {
    const target = canNavigate(rawUrl, currentHref);
    if (!target) return false;
    window.location.assign(target.href);
    return true;
  }

  function findRadioInputFromEvent(event, productInfo) {
    const pathTarget = event.target instanceof Element ? event.target : null;
    if (!pathTarget || !productInfo.contains(pathTarget)) return null;

    const direct = pathTarget.closest('input[type="radio"]');
    if (direct && productInfo.contains(direct)) return direct;

    const label = pathTarget.closest('label');
    if (!label) return null;

    if (label.htmlFor) {
      const byId = document.getElementById(label.htmlFor);
      if (byId?.type === 'radio' && productInfo.contains(byId)) return byId;
    }

    const nested = label.querySelector('input[type="radio"]');
    return nested && productInfo.contains(nested) ? nested : null;
  }

  function getCheckedMockInput(productInfo, config) {
    const inputs = productInfo.querySelectorAll('input[type="radio"]');
    for (const input of inputs) {
      if (input.checked && isMockOptionControl(input, config)) return input;
    }
    return null;
  }

  function initVariantLinkRedirect() {
    if (window.Shopify?.designMode) return;
    if (typeof subscribe !== 'function' || typeof PUB_SUB_EVENTS === 'undefined') return;

    const productInfo = document.querySelector(
      `product-info[data-product-template-suffix="${TEMPLATE_SUFFIX}"]`
    );
    if (!productInfo) return;

    const configEl = document.getElementById(`VariantLinkConfig-${productInfo.dataset.section}`);
    if (!configEl) return;

    let config;
    try {
      config = JSON.parse(configEl.textContent);
    } catch {
      return;
    }

    let userHasChangedVariant = false;
    let mockOptionChanged = false;
    let navigated = false;
    let cleanUrl = window.location.href;
    let previousMockInput = getCheckedMockInput(productInfo, config);

    // bfcache Back restores JS heap with navigated=true — reset so Type can jump again.
    window.addEventListener('pageshow', () => {
      navigated = false;
      userHasChangedVariant = false;
      mockOptionChanged = false;
      cleanUrl = window.location.href;
      previousMockInput = getCheckedMockInput(productInfo, config);
    });

    // Capture click BEFORE Dawn toggles radios / replaceState — Back returns to clean Mug state.
    productInfo.addEventListener(
      'click',
      (event) => {
        if (navigated) return;

        const input = findRadioInputFromEvent(event, productInfo);
        if (!input || !isMockOptionControl(input, config)) return;

        const rawUrl = config.byMock?.[String(input.value || '').trim()] || '';
        if (!tryNavigate(rawUrl, cleanUrl)) return;

        navigated = true;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      true
    );

    // Keyboard / fallback: change already flipped control — revert then leave.
    productInfo.addEventListener(
      'change',
      (event) => {
        if (navigated) return;

        const control = event.target;
        if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLSelectElement)) return;
        if (!productInfo.contains(control)) return;
        if (!isMockOptionControl(control, config)) return;

        const mockValue = selectedOptionLabel(control, control);
        const rawUrl = mockValue ? config.byMock?.[mockValue] || '' : '';
        const target = canNavigate(rawUrl, cleanUrl);
        if (!target) {
          if (control instanceof HTMLInputElement && control.type === 'radio') {
            previousMockInput = control;
          }
          return;
        }

        event.stopImmediatePropagation();

        if (control instanceof HTMLInputElement && control.type === 'radio') {
          if (previousMockInput && previousMockInput !== control) {
            previousMockInput.checked = true;
          } else {
            control.checked = false;
          }
        }

        navigated = true;
        window.location.assign(target.href);
      },
      true
    );

    subscribe(PUB_SUB_EVENTS.optionValueSelectionChange, ({ data }) => {
      const event = data?.event;
      if (!event?.target || !productInfo.contains(event.target)) return;
      if (navigated) return;

      userHasChangedVariant = true;
      const control = getOptionControl(data.target) || getOptionControl(event.target);
      mockOptionChanged = isMockOptionControl(control, config);

      // Fallback if click intercept missed (e.g. non-radio picker).
      if (!mockOptionChanged) return;

      const mockValue = selectedOptionLabel(control, data.target);
      const rawUrl = mockValue ? config.byMock?.[mockValue] || '' : '';
      if (tryNavigate(rawUrl, cleanUrl)) {
        navigated = true;
      }
    });

    subscribe(PUB_SUB_EVENTS.variantChange, ({ data: { variant } }) => {
      if (navigated) return;
      if (!userHasChangedVariant || !variant?.id) return;

      const rawUrl = resolveRedirectUrl(config, variant, mockOptionChanged);
      mockOptionChanged = false;

      if (tryNavigate(rawUrl, cleanUrl)) {
        navigated = true;
      }
    });
  }

  // Expose for self-check / console
  window.__myprintsyVariantLink = {
    resolveRedirectUrl,
    isMockOptionControl,
    mockValueFromVariant,
    selectedOptionLabel,
    tryNavigate,
  };

  // ponytail: self-check — mock change uses byMock; color change stays byId-only
  (function variantLinkSelfCheck() {
    const config = {
      variants: { '1': '', '2': 'https://example.com/mug-black' },
      byMock: { Mug: 'https://example.com/mug' },
    };
    const mugPink = { id: 1, option1: 'Mug', option2: 'Hot Pink' };
    const mugBlack = { id: 2, option1: 'Mug', option2: 'Black' };

    const cases = [
      [resolveRedirectUrl(config, mugPink, true), 'https://example.com/mug'],
      [resolveRedirectUrl(config, mugPink, false), ''],
      [resolveRedirectUrl(config, mugBlack, false), 'https://example.com/mug-black'],
    ];

    for (const [got, expected] of cases) {
      if (got !== expected) {
        console.error('[variant-link] self-check failed', { got, expected });
      }
    }
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initVariantLinkRedirect);
  } else {
    initVariantLinkRedirect();
  }
})();
