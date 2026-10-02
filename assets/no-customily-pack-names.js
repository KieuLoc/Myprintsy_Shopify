/**
 * Template product.no-customily only:
 * Show N name inputs for Pack N (Buy more save more).
 * No Pack option on the product → always exactly 1 name field.
 */
(function () {
  const ROOT_SEL = '[data-myprintsy-pack-names]';
  const MAX_SLOTS = 6;

  function isNoCustomilyPage() {
    return !!document.querySelector(
      'product-info.myprintsy-no-customily-preview, product-info[data-product-template-suffix="no-customily"]'
    );
  }

  function extractPackCount(value) {
    if (!value) return 1;
    const m = String(value).match(/(\d+)/);
    if (!m) return 1;
    const n = parseInt(m[1], 10);
    if (!n || n < 1) return 1;
    return Math.min(n, MAX_SLOTS);
  }

  function looksLikePackLabel(text) {
    const t = String(text || '').toLowerCase();
    return t.includes('pack') || t.includes('buy more') || t.includes('save more');
  }

  /** True only when PDP has a Pack / Buy more option UI. */
  function hasPackOption(productInfo) {
    if (!productInfo) return false;
    const fieldsets = productInfo.querySelectorAll('variant-selects fieldset');
    for (const fs of fieldsets) {
      const legend = fs.querySelector('legend, .form__label')?.textContent || '';
      if (looksLikePackLabel(legend)) return true;
      const labels = fs.querySelectorAll('label');
      for (const lab of labels) {
        if (looksLikePackLabel(lab.textContent) || /pack\s*\d+/i.test(lab.textContent || '')) return true;
      }
    }
    const selects = productInfo.querySelectorAll('variant-selects select[name^="options"]');
    for (const sel of selects) {
      const id = sel.id;
      const labelEl = id ? productInfo.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      if (looksLikePackLabel(labelEl?.textContent || sel.getAttribute('name') || '')) return true;
    }
    return false;
  }

  function getSelectedPackCount(root) {
    const productInfo = root.closest('product-info') || document.querySelector('product-info');
    if (!productInfo) return 1;

    // Rule: no Pack option → always 1 name field
    if (!hasPackOption(productInfo)) return 1;

    // 1) Checked radio whose label/legend looks like Pack / Buy more
    const radios = productInfo.querySelectorAll('variant-selects fieldset input[type="radio"]:checked');
    for (const radio of radios) {
      const fs = radio.closest('fieldset');
      const legend = fs?.querySelector('legend, .form__label')?.textContent || '';
      const label =
        (radio.nextElementSibling && radio.nextElementSibling.textContent) ||
        productInfo.querySelector(`label[for="${CSS.escape(radio.id)}"]`)?.textContent ||
        '';
      if (looksLikePackLabel(legend) || looksLikePackLabel(label) || looksLikePackLabel(radio.value)) {
        return extractPackCount(radio.value || label);
      }
    }

    // 2) Any checked control whose visible text is "Pack N"
    const checkedLabels = productInfo.querySelectorAll(
      'variant-selects fieldset input[type="radio"]:checked + label'
    );
    for (const lab of checkedLabels) {
      const t = lab.textContent || '';
      if (/pack\s*\d+/i.test(t)) return extractPackCount(t);
    }

    // 3) Select dropdowns
    const selects = productInfo.querySelectorAll('variant-selects select[name^="options"]');
    for (const sel of selects) {
      const id = sel.id;
      const labelEl = id ? productInfo.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
      const labelText = labelEl?.textContent || sel.getAttribute('name') || '';
      if (!looksLikePackLabel(labelText) && !looksLikePackLabel(sel.value)) continue;
      return extractPackCount(sel.value);
    }

    return 1;
  }

  function syncSlots(root) {
    const count = getSelectedPackCount(root);
    root.dataset.packCount = String(count);
    const slots = root.querySelectorAll('[data-pack-name-slot]');
    slots.forEach(function (slot) {
      const i = parseInt(slot.getAttribute('data-pack-name-slot'), 10) || 0;
      const input = slot.querySelector('input');
      const active = i >= 1 && i <= count;
      slot.hidden = !active;
      slot.style.display = active ? '' : 'none';
      if (!input) return;
      input.disabled = !active;
      input.required = active;
    });
  }

  function bind(root) {
    if (root.dataset.bound === '1') {
      syncSlots(root);
      return;
    }
    root.dataset.bound = '1';

    const productInfo = root.closest('product-info') || document;

    productInfo.addEventListener(
      'change',
      function () {
        syncSlots(root);
      },
      true
    );

    productInfo.addEventListener(
      'click',
      function (e) {
        const t = e.target;
        if (!t) return;
        if (t.closest && t.closest('variant-selects label, variant-selects fieldset')) {
          window.setTimeout(function () {
            syncSlots(root);
          }, 0);
          window.setTimeout(function () {
            syncSlots(root);
          }, 50);
        }
      },
      true
    );

    // Dawn pubsub (if present)
    try {
      if (typeof subscribe === 'function' && window.PUB_SUB_EVENTS?.variantChange) {
        subscribe(PUB_SUB_EVENTS.variantChange, function () {
          syncSlots(root);
        });
      }
    } catch (_) {}

    syncSlots(root);
  }

  function init() {
    if (!isNoCustomilyPage()) return;
    document.querySelectorAll(ROOT_SEL).forEach(bind);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.setTimeout(init, 300);
  window.setTimeout(init, 1000);
  window.setTimeout(init, 2500);
})();
