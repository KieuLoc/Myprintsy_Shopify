/**
 * Delivery Date ETA (SetuBridge):
 * - Keep .custom_delivery_estimation_widget VISIBLE (app won't inject if display:none)
 * - Move slot + .sb_ETA above Size / variant picker
 * - WP-style UI: hide country <select> until user clicks country name
 */
(function () {
  var OPEN_CLASS = 'is-country-open';
  var pickerOpen = false;
  var ignoreOutsideUntil = 0;

  function show(el, display) {
    if (!el || !el.style) return;
    el.style.setProperty('display', display || 'block', 'important');
    el.style.setProperty('visibility', 'visible', 'important');
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('height', 'auto', 'important');
    el.style.setProperty('max-height', 'none', 'important');
    el.style.setProperty('overflow', 'visible', 'important');
  }

  function hideCountryChecker(checker) {
    if (!checker || !checker.style) return;
    checker.style.setProperty('display', 'none', 'important');
    checker.style.setProperty('visibility', 'hidden', 'important');
    checker.style.setProperty('height', '0', 'important');
    checker.style.setProperty('margin', '0', 'important');
    checker.style.setProperty('overflow', 'hidden', 'important');
  }

  function openCountryChecker(checker) {
    if (!checker || !checker.style) return;
    checker.style.setProperty('display', 'flex', 'important');
    checker.style.setProperty('flex-direction', 'column', 'important');
    checker.style.setProperty('visibility', 'visible', 'important');
    checker.style.setProperty('opacity', '1', 'important');
    checker.style.setProperty('height', 'auto', 'important');
    checker.style.setProperty('max-height', 'none', 'important');
    checker.style.setProperty('overflow', 'visible', 'important');
    checker.style.setProperty('margin', '0 0 10px', 'important');
    checker.style.setProperty('width', '100%', 'important');
  }

  function selectedCountryLabel(select) {
    if (!select || select.selectedIndex < 0) return '';
    var opt = select.options[select.selectedIndex];
    return opt ? String(opt.textContent || '').trim() : '';
  }

  function getEta() {
    return document.querySelector('.product__info-container .sb_ETA') || document.querySelector('.sb_ETA');
  }

  function syncCountryName(eta) {
    if (!eta) return;
    var select = eta.querySelector('select.edd_country_msg_change');
    var nameBtn = eta.querySelector('.myprintsy-edd-country-name');
    if (!select || !nameBtn) return;
    var label = selectedCountryLabel(select);
    if (label) nameBtn.textContent = label;
  }

  function closeCountryPicker(eta) {
    pickerOpen = false;
    ignoreOutsideUntil = 0;
    eta = eta || getEta();
    if (!eta) return;
    eta.classList.remove(OPEN_CLASS);
    eta.dataset.eddPickerOpen = '0';
    hideCountryChecker(eta.querySelector('.sb_country_checker'));
    var btn = eta.querySelector('.myprintsy-edd-country-name');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function openCountryPicker(eta) {
    eta = eta || getEta();
    if (!eta) return;
    pickerOpen = true;
    ignoreOutsideUntil = Date.now() + 400;
    eta.classList.add(OPEN_CLASS);
    eta.dataset.eddPickerOpen = '1';

    var checker = eta.querySelector('.sb_country_checker');
    openCountryChecker(checker);

    var select = eta.querySelector('select.edd_country_msg_change');
    if (select) {
      select.style.setProperty('display', 'block', 'important');
      select.style.setProperty('visibility', 'visible', 'important');
      select.style.setProperty('opacity', '1', 'important');
      select.style.setProperty('width', '100%', 'important');
      select.style.setProperty('min-height', '44px', 'important');
      select.style.setProperty('height', '44px', 'important');
      select.style.setProperty('pointer-events', 'auto', 'important');
      select.style.setProperty('position', 'relative', 'important');
      select.style.setProperty('z-index', '5', 'important');
    }

    var btn = eta.querySelector('.myprintsy-edd-country-name');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function toggleCountryPicker(eta) {
    eta = eta || getEta();
    if (!eta) return;
    if (pickerOpen || eta.classList.contains(OPEN_CLASS) || eta.dataset.eddPickerOpen === '1') {
      closeCountryPicker(eta);
    } else {
      openCountryPicker(eta);
    }
  }

  function applyCheckerVisibility(eta) {
    var checker = eta.querySelector('.sb_country_checker');
    if (!checker) return;
    if (pickerOpen || eta.dataset.eddPickerOpen === '1' || eta.classList.contains(OPEN_CLASS)) {
      openCountryPicker(eta);
    } else {
      hideCountryChecker(checker);
    }
  }

  function forceDeliveryToInline(firstRow) {
    if (!firstRow) return;
    firstRow.style.setProperty('display', 'block', 'important');
    firstRow.style.removeProperty('flex-direction');
    firstRow.style.removeProperty('flex-wrap');
    firstRow.style.removeProperty('align-items');
    firstRow.style.setProperty('gap', '0', 'important');

    Array.prototype.forEach.call(firstRow.children, function (child) {
      if (child.tagName === 'BR') {
        child.remove();
        return;
      }
      var raw = (child.textContent || '').replace(/\uFEFF/g, '').trim();
      if (
        child.tagName === 'SPAN' &&
        !child.classList.contains('country_flag_wrapper') &&
        !raw &&
        !child.querySelector('img,button')
      ) {
        child.style.setProperty('display', 'none', 'important');
        return;
      }
      if (child.classList.contains('country_flag_wrapper')) {
        child.style.setProperty('display', 'inline-flex', 'important');
        child.style.setProperty('margin', '0 6px 0 0', 'important');
        child.style.setProperty('vertical-align', 'middle', 'important');
      } else {
        child.style.setProperty('display', 'inline', 'important');
        child.style.setProperty('margin', '0', 'important');
        child.style.setProperty('padding', '0', 'important');
        child.style.setProperty('vertical-align', 'baseline', 'important');
      }
      child.style.setProperty('width', 'auto', 'important');
    });
  }

  function enhanceWpUi(eta) {
    if (!eta) return false;

    var select = eta.querySelector('select.edd_country_msg_change');
    var deliveryMsg = eta.querySelector('.delivery_msg');
    var checker = eta.querySelector('.sb_country_checker');
    if (!select || !deliveryMsg || !checker) return false;

    eta.classList.add('myprintsy-edd-wp');
    applyCheckerVisibility(eta);

    var existingBtn = eta.querySelector('.myprintsy-edd-country-name');
    var flagWrap = deliveryMsg.querySelector('.country_flag_wrapper');
    var firstRow = existingBtn
      ? existingBtn.closest('.myprintsy-edd-delivery-to') || (flagWrap ? flagWrap.closest('div') : deliveryMsg.querySelector('div'))
      : flagWrap
        ? flagWrap.closest('div')
        : deliveryMsg.querySelector('div');

    // Already enhanced — only sync label. Re-running forceDeliveryToInline every poll
    // fights SetuBridge (BR/span churn) and makes Style/Color/Pack jump.
    if (eta.dataset.myprintsyEddWp === '1' && existingBtn) {
      syncCountryName(eta);
      return true;
    }

    if (!firstRow) return false;

    eta.dataset.myprintsyEddWp = '1';
    firstRow.classList.add('myprintsy-edd-delivery-to');
    firstRow.setAttribute('data-edd-country-trigger', '1');
    firstRow.style.setProperty('cursor', 'pointer', 'important');
    forceDeliveryToInline(firstRow);

    if (flagWrap) {
      flagWrap.style.setProperty('display', 'inline-flex', 'important');
      flagWrap.style.setProperty('align-items', 'center', 'important');
      if (flagWrap.parentNode !== firstRow || firstRow.firstChild !== flagWrap) {
        firstRow.insertBefore(flagWrap, firstRow.firstChild);
      }
    }

    var nameBtn = existingBtn;
    if (!nameBtn) {
      nameBtn = document.createElement('button');
      nameBtn.type = 'button';
      nameBtn.className = 'myprintsy-edd-country-name';
      nameBtn.setAttribute('aria-expanded', 'false');
      nameBtn.setAttribute('aria-haspopup', 'listbox');
      firstRow.appendChild(nameBtn);
    }

    nameBtn.textContent = selectedCountryLabel(select) || 'Select country';
    nameBtn.style.setProperty('display', 'inline', 'important');
    nameBtn.style.setProperty('margin', '0', 'important');
    nameBtn.style.setProperty('padding', '0', 'important');
    nameBtn.style.setProperty('vertical-align', 'baseline', 'important');

    if (eta.dataset.myprintsyEddSelectBound !== '1') {
      eta.dataset.myprintsyEddSelectBound = '1';
      select.addEventListener('change', function () {
        syncCountryName(eta);
        closeCountryPicker(eta);
      });
    }

    return true;
  }

  function isSlotPlaced(slot, variant, price, bmsm) {
    if (!slot) return false;
    // Prefer right under Buy More Save More (avoids Size Chart gap between them).
    if (bmsm) return slot === bmsm.nextElementSibling;
    if (variant) return slot === variant.previousElementSibling;
    if (price) return slot.previousElementSibling === price || slot === price.nextElementSibling;
    return true;
  }

  function placeSlot(info) {
    var variant = info.querySelector('variant-selects, variant-radios');
    var price = info.querySelector('[id^="price-"]');
    var bmsm = info.querySelector('.bmsm');
    var slots = info.querySelectorAll('.custom_delivery_estimation_widget');
    if (!slots.length) return null;

    var slot =
      info.querySelector('.custom_delivery_estimation_widget[data-myprintsy-edd-slot]') ||
      slots[0];

    slots.forEach(function (s) {
      if (s === slot) return;
      if (s.querySelector('.sb_ETA')) return;
      if (s.innerHTML.trim()) return;
      s.style.setProperty('display', 'none', 'important');
    });

    show(slot, 'block');
    slot.style.setProperty('margin', '0 0 12px', 'important');
    slot.style.setProperty('width', '100%', 'important');
    slot.style.setProperty('min-height', '0', 'important');

    // Skip insertBefore when already in place — re-insert thrash = pills jump.
    if (!isSlotPlaced(slot, variant, price, bmsm)) {
      if (bmsm && !bmsm.contains(slot)) {
        bmsm.insertAdjacentElement('afterend', slot);
      } else if (variant && !variant.contains(slot)) {
        variant.parentNode.insertBefore(slot, variant);
      } else if (price && !variant) {
        price.insertAdjacentElement('afterend', slot);
      }
    }

    return slot;
  }

  function placeEta(info, slot) {
    var eta = info.querySelector('.sb_ETA') || document.querySelector('.sb_ETA');
    if (!eta) return false;

    var variant = info.querySelector('variant-selects, variant-radios');

    if (!pickerOpen) {
      if (slot && !slot.contains(eta)) {
        slot.appendChild(eta);
      } else if (!slot && variant && eta !== variant.previousElementSibling && !variant.contains(eta)) {
        variant.parentNode.insertBefore(eta, variant);
      }
    }

    show(eta, 'block');
    eta.style.setProperty('margin', '0', 'important');
    eta.style.setProperty('width', '100%', 'important');

    ['.sb_delivery', '.deliverydate', '.delivery_msg', '.animation_class'].forEach(function (sel) {
      eta.querySelectorAll(sel).forEach(function (node) {
        show(node, 'block');
      });
    });

    // Keep flag inline in WP mode (don't force display:block)
    eta.querySelectorAll('.country_flag_wrapper').forEach(function (node) {
      node.style.setProperty('display', 'inline-flex', 'important');
      node.style.setProperty('visibility', 'visible', 'important');
      node.style.setProperty('opacity', '1', 'important');
      node.style.setProperty('height', 'auto', 'important');
      node.style.setProperty('max-height', 'none', 'important');
      node.style.setProperty('overflow', 'visible', 'important');
      node.style.setProperty('align-items', 'center', 'important');
    });

    enhanceWpUi(eta);

    if (slot) show(slot, 'block');
    return true;
  }

  function isPlacementStable(info) {
    if (!info) return false;
    var variant = info.querySelector('variant-selects, variant-radios');
    var bmsm = info.querySelector('.bmsm');
    var slot = info.querySelector('.custom_delivery_estimation_widget[data-myprintsy-edd-slot]') ||
      info.querySelector('.custom_delivery_estimation_widget');
    var eta = info.querySelector('.sb_ETA');
    if (!slot || !eta || !eta.classList.contains('myprintsy-edd-wp')) return false;
    if (bmsm) {
      if (slot !== bmsm.nextElementSibling) return false;
    } else if (variant && slot !== variant.previousElementSibling) {
      return false;
    }
    if (!slot.contains(eta)) return false;
    return true;
  }

  function run() {
    if (window.__myprintsyEddPlacing || window.__myprintsyPdpUpdating) return;
    window.__myprintsyEddPlacing = true;
    try {
      document.querySelectorAll('.product__info-container').forEach(function (info) {
        var slot = placeSlot(info);
        placeEta(info, slot);
      });
    } finally {
      // Ignore MO callbacks from our own DOM writes (same turn + short settle).
      window.setTimeout(function () {
        window.__myprintsyEddPlacing = false;
      }, 50);
    }
  }

  function isCountryTrigger(el) {
    if (!el || !el.closest) return null;
    return (
      el.closest('.myprintsy-edd-country-name') ||
      el.closest('[data-edd-country-trigger]') ||
      el.closest('.myprintsy-edd-delivery-to')
    );
  }

  if (!window.__myprintsyEddCountryUiBound) {
    window.__myprintsyEddCountryUiBound = true;

    document.addEventListener(
      'pointerdown',
      function (e) {
        var trigger = isCountryTrigger(e.target);
        if (!trigger) return;
        // Don't steal clicks from the select itself
        if (e.target.closest && e.target.closest('select.edd_country_msg_change, .sb_country_checker')) return;

        e.preventDefault();
        e.stopPropagation();
        var eta = trigger.closest('.sb_ETA') || getEta();
        toggleCountryPicker(eta);
      },
      true
    );

    document.addEventListener(
      'click',
      function (e) {
        // Outside click closes — but ignore right after open (same gesture / delayed events)
        if (Date.now() < ignoreOutsideUntil) return;
        if (isCountryTrigger(e.target)) return;
        if (e.target.closest && e.target.closest('.sb_country_checker, select.edd_country_msg_change')) return;

        if (!pickerOpen) return;
        var eta = getEta();
        if (eta && eta.contains(e.target)) return;
        closeCountryPicker(eta);
      },
      true
    );
  }

  run();
  document.addEventListener('DOMContentLoaded', run);
  window.addEventListener('load', run);

  var attempts = 0;
  var timer = window.setInterval(function () {
    run();
    attempts += 1;
    var info = document.querySelector('.product__info-container');
    // Stop polling once slot sits stably above variant pills (was 40s of thrash).
    if (isPlacementStable(info) || attempts >= 40) window.clearInterval(timer);
  }, 250);

  if (typeof MutationObserver === 'function' && document.documentElement) {
    var scheduled = false;
    new MutationObserver(function () {
      if (scheduled || window.__myprintsyPdpUpdating || window.__myprintsyEddPlacing) return;
      // Already stable — ignore SetuBridge micro-updates (don't re-place).
      var info = document.querySelector('.product__info-container');
      if (isPlacementStable(info)) return;
      scheduled = true;
      window.setTimeout(function () {
        scheduled = false;
        if (window.__myprintsyPdpUpdating || window.__myprintsyEddPlacing) return;
        run();
      }, 200);
    }).observe(document.documentElement, { childList: true, subtree: true });
  }
})();
