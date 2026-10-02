(function () {
  const BUTTON_ATTR = 'data-myprintsy-preview-atc';
  const CLOSE_ATTR = 'data-myprintsy-preview-close';
  const CORNER_X_ATTR = 'data-myprintsy-preview-x';
  const HEADER_ATTR = 'data-myprintsy-preview-header';
  const TRUST_ATTR = 'data-myprintsy-preview-trust';
  const ACTIONS_ATTR = 'data-myprintsy-preview-actions';
  const TRIGGER_EVENT = 'customily-trigger-add-to-cart';
  const SHOW_EVENT = 'customily-preview-modal-show';
  const STYLED_CLASS = 'myprintsy-preview-modal--macorner';

  const MODAL_SELECTORS = [
    '.customily-modal-preview-only',
    '#csh-list-preview-modal',
    '.csh-preview-options-modal',
  ];

  const HOST_SELECTORS = [
    '.main.cl-use-image',
    '.main',
    '.csh-preview-options-modal-content',
    '.cl-preview-wrapper',
  ];

  /** Template product.no-customily: keep Customily name inputs, freeze Shopify gallery. */
  function isStaticShopifyGalleryMode() {
    return !!document.querySelector(
      'product-info.myprintsy-no-customily-preview, product-info[data-product-template-suffix="no-customily"]'
    );
  }

  function markStaticShopifyGalleryChrome() {
    if (!isStaticShopifyGalleryMode()) return false;
    document.documentElement.classList.add('myprintsy-no-customily-preview');
    return true;
  }

  function isShopifyCdnSrc(src) {
    return /cdn\.shopify\.com|shopify\.com\/s\/files/i.test(String(src || ''));
  }

  function isCustomilyMediaSrc(src) {
    return /customily|cl-preview/i.test(String(src || ''));
  }

  let injectTimer = null;
  let observer = null;

  function findNativeAtc() {
    return (
      document.querySelector('product-form .product-form__submit') ||
      document.querySelector('form[action*="/cart/add"] [name="add"]') ||
      document.querySelector('form[action*="/cart/add"] button[type="submit"]')
    );
  }

  function triggerAddToCart() {
    window.dispatchEvent(new CustomEvent(TRIGGER_EVENT, { bubbles: true }));
    const atc = findNativeAtc();
    if (atc && !atc.disabled) atc.click();
  }

  /**
   * First visible required Customily option still unanswered, else null.
   * Customily marks required options with `.customily-required-label`; a swatch group with no
   * checked radio or an empty text field is what makes it refuse to submit.
   */
  function findIncompleteRequiredOption() {
    const opts = Array.from(document.querySelectorAll('.customily_option'));
    for (let i = 0; i < opts.length; i++) {
      const opt = opts[i];
      if (!opt.querySelector('.customily-required-label')) continue;
      if (opt.offsetParent === null) continue;

      const radios = Array.from(opt.querySelectorAll('input[type="radio"]'));
      if (radios.length) {
        if (!radios.some((radio) => radio.checked)) return opt;
        continue;
      }
      const field = opt.querySelector('input[type="text"], textarea');
      if (field && !String(field.value).trim()) return opt;
    }
    return null;
  }

  /** Send the shopper to the option they still have to answer. */
  function focusRequiredOption(opt) {
    const trigger = opt.querySelector('label[role="button"]');
    if (trigger && trigger.getAttribute('aria-expanded') === 'false') trigger.click();
    try {
      opt.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (_) {
      opt.scrollIntoView();
    }

    const radio = opt.querySelector('input[type="radio"]');
    if (radio) {
      try {
        radio.focus({ preventScroll: true });
      } catch (_) {}
      return;
    }
    const field = opt.querySelector('input[type="text"], textarea');
    if (field) unlockNameInputForTyping(field);
  }

  /** Open Dawn cart-notification immediately while Customily finishes generate/add. */
  function openCartNotificationOptimistic() {
    // Customily blocks the submit until every required option is answered, so a popup opened
    // now would sit at "Loading…" until the 15s ceiling. Point at the missing option instead.
    const missing = findIncompleteRequiredOption();
    if (missing) {
      focusRequiredOption(missing);
      return;
    }

    const cart = document.querySelector('cart-notification');
    if (!cart || typeof cart.openOptimistic !== 'function') return;
    cart.openOptimistic({ fromUserGesture: true });
  }

  function closePreviewModal(modal) {
    if (!modal) return;
    const nativeClose =
      modal.querySelector('.customily-close-button') ||
      modal.querySelector('[class*="close-button"]') ||
      modal.querySelector('button[aria-label*="lose" i]') ||
      modal.querySelector('.close');
    if (nativeClose) {
      nativeClose.click();
      return;
    }
    modal.classList.add('hide-customily-preview-modal');
    modal.style.display = 'none';
  }

  function buildHeader() {
    const header = document.createElement('div');
    header.className = 'myprintsy-customily-preview-header';
    header.setAttribute(HEADER_ATTR, '');
    header.innerHTML =
      '<p class="myprintsy-customily-preview-header__title">' +
      '<span class="myprintsy-customily-preview-header__icon" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">' +
      '<path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12Z" stroke="currentColor" stroke-width="1.75"/>' +
      '<circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/>' +
      '</svg></span>' +
      '<span>Looks Good to Go?</span></p>' +
      '<p class="myprintsy-customily-preview-header__sub">Please double-check your preview to receive your item faster.</p>';
    return header;
  }

  function buildCornerClose(modal) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'myprintsy-customily-preview-x';
    btn.setAttribute(CORNER_X_ATTR, '');
    btn.setAttribute('aria-label', 'Close preview');
    btn.innerHTML = '&times;';
    btn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      closePreviewModal(modal);
    });
    return btn;
  }

  /** Customily X sits in card flow (top-center) and leaves a huge blank band â€” hide it. */
  function hideNativeClose(modal) {
    if (!modal) return;
    modal
      .querySelectorAll(
        '.customily-close-button, [class*="customily-close"], [class*="CustomilyClose"]'
      )
      .forEach(function (el) {
        if (el.hasAttribute(CORNER_X_ATTR) || el.hasAttribute(CLOSE_ATTR)) return;
        el.classList.add('myprintsy-hide-native-preview-x');
        el.setAttribute('aria-hidden', 'true');
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('height', '0', 'important');
        el.style.setProperty('margin', '0', 'important');
        el.style.setProperty('padding', '0', 'important');
        el.style.setProperty('overflow', 'hidden', 'important');
        el.style.setProperty('position', 'absolute', 'important');
        el.style.setProperty('pointer-events', 'none', 'important');
      });
  }

  let cachedBuyersCount = null;

  function getBuyersCount() {
    if (cachedBuyersCount != null) return cachedBuyersCount;

    // Prefer number already shown on PDP trust line.
    const existing = document.querySelector('[data-myprintsy-trust-buyers][data-filled="1"]');
    if (existing) {
      const parsed = parseInt(String(existing.textContent || '').trim(), 10);
      if (!Number.isNaN(parsed) && parsed >= 20 && parsed <= 200) {
        cachedBuyersCount = parsed;
        return cachedBuyersCount;
      }
    }

    cachedBuyersCount = Math.floor(Math.random() * (200 - 20 + 1)) + 20;
    return cachedBuyersCount;
  }

  function buildTrust() {
    const buyers = getBuyersCount();
    const trust = document.createElement('div');
    trust.className = 'myprintsy-customily-preview-trust';
    trust.setAttribute(TRUST_ATTR, '');
    trust.innerHTML =
      '<p class="myprintsy-customily-preview-trust__line">' +
      '<span class="myprintsy-customily-preview-trust__check" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">' +
      '<circle cx="12" cy="12" r="10" fill="#2f6fed"/>' +
      '<path d="M7.5 12.2 10.4 15l6.1-6.2" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>' +
      '<span>Full refund for faulty production. No question asked</span></p>' +
      '<p class="myprintsy-customily-preview-trust__line">' +
      '<span class="myprintsy-customily-preview-trust__check" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">' +
      '<circle cx="12" cy="12" r="10" fill="#2f6fed"/>' +
      '<path d="M7.5 12.2 10.4 15l6.1-6.2" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>' +
      '</svg></span>' +
      '<span>In demand. ' +
      buyers +
      ' people bought this in the last 24 hours.</span></p>';
    return trust;
  }

  function fillPdpTrustBuyers() {
    const buyers = String(getBuyersCount());
    document.querySelectorAll('[data-myprintsy-trust-buyers]').forEach(function (el) {
      // Avoid MutationObserver feedback (characterData) â€” only write when needed.
      if (el.getAttribute('data-filled') === '1' && String(el.textContent) === buyers) return;
      el.textContent = buyers;
      el.setAttribute('data-filled', '1');
    });
  }

  function setPreviewAtcLoading(button, isLoading) {
    if (!button) return;
    if (isLoading) {
      button.setAttribute('aria-busy', 'true');
      button.setAttribute('aria-disabled', 'true');
      button.classList.add('is-loading');
      if (!button.querySelector('.myprintsy-customily-preview-atc__spinner')) {
        const spin = document.createElement('span');
        spin.className = 'myprintsy-customily-preview-atc__spinner';
        spin.setAttribute('aria-hidden', 'true');
        button.appendChild(spin);
      }
    } else {
      button.removeAttribute('aria-busy');
      button.removeAttribute('aria-disabled');
      button.classList.remove('is-loading');
      button.querySelector('.myprintsy-customily-preview-atc__spinner')?.remove();
    }
  }

  function buildActions(modal) {
    const wrap = document.createElement('div');
    wrap.className = 'myprintsy-customily-preview-actions';
    wrap.setAttribute(ACTIONS_ATTR, '');

    const atc = document.createElement('button');
    atc.type = 'button';
    atc.setAttribute(BUTTON_ATTR, '');
    atc.className = 'myprintsy-customily-preview-atc';
    atc.innerHTML =
      '<span class="myprintsy-customily-preview-atc__icon" aria-hidden="true">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none">' +
      '<path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M6 6 5 3H2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="9" cy="20" r="1.25" fill="currentColor"/>' +
      '<circle cx="17" cy="20" r="1.25" fill="currentColor"/>' +
      '<path d="M12 9v5M9.5 11.5H14.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '</svg></span><span>Add to Cart</span>';
    atc.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      if (atc.getAttribute('aria-busy') === 'true') return;

      // Optimistic: show cart-notification + close preview immediately (ATC still runs).
      setPreviewAtcLoading(atc, true);
      window.__myprintsyFromPreviewAtc = true;
      document.documentElement.classList.add('myprintsy-preview-atc-inflight');
      openCartNotificationOptimistic();
      closePreviewModal(modal);

      let cleared = false;
      let unsubError = null;
      let unsubUpdate = null;

      function clearPreviewLoading() {
        if (cleared) return;
        cleared = true;
        window.__myprintsyFromPreviewAtc = false;
        document.documentElement.classList.remove('myprintsy-preview-atc-inflight');
        setPreviewAtcLoading(atc, false);
        if (typeof unsubError === 'function') unsubError();
        if (typeof unsubUpdate === 'function') unsubUpdate();
      }

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        unsubError = subscribe(PUB_SUB_EVENTS.cartError, function () {
          clearPreviewLoading();
          const cart = document.querySelector('cart-notification');
          if (cart && typeof cart.closeOptimistic === 'function') cart.closeOptimistic();
        });
        unsubUpdate = subscribe(PUB_SUB_EVENTS.cartUpdate, function () {
          clearPreviewLoading();
        });
      }

      window.setTimeout(function () {
        clearPreviewLoading();
      }, 15000);
      triggerAddToCart();
    });

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.setAttribute(CLOSE_ATTR, '');
    closeBtn.className = 'myprintsy-customily-preview-close-btn';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      closePreviewModal(modal);
    });

    wrap.appendChild(atc);
    wrap.appendChild(closeBtn);
    return wrap;
  }

  function isVisible(el) {
    if (!el) return false;
    if (el.classList.contains('hide-customily-preview-modal')) return false;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function findHost(modal) {
    for (let i = 0; i < HOST_SELECTORS.length; i++) {
      const host = modal.querySelector(HOST_SELECTORS[i]);
      if (host) return host;
    }
    return modal;
  }

  function findPreviewNode(host) {
    return (
      host.querySelector('.cl-preview-wrapper') ||
      host.querySelector('.cl-preview-image') ||
      host.querySelector('img')
    );
  }

  function insertBeforePreview(host, node) {
    const preview = findPreviewNode(host);
    if (preview && preview.parentNode === host) host.insertBefore(node, preview);
    else if (preview && preview.parentNode) preview.parentNode.insertBefore(node, preview);
    else host.insertBefore(node, host.firstChild);
  }

  function insertAfterPreview(host, node) {
    const preview = findPreviewNode(host);
    if (preview && preview.parentNode === host) {
      if (preview.nextSibling) host.insertBefore(node, preview.nextSibling);
      else host.appendChild(node);
    } else if (preview && preview.parentNode) {
      preview.parentNode.appendChild(node);
    } else {
      host.appendChild(node);
    }
  }

  /** Pack + Enter Name fingerprint — remembered Preview URL only valid while this matches. */
  function getPreviewPersonalizationKey() {
    const root = document.querySelector('product-info') || document;
    // Variant id changes with Pack — most reliable invalidate signal.
    const variantInput =
      root.querySelector('product-form form [name="id"], form[action*="/cart/add"] [name="id"], [name="id"]');
    const variantId = variantInput ? String(variantInput.value || '') : '';

    const options = [];
    root.querySelectorAll('variant-selects fieldset, variant-radios fieldset').forEach(function (fs) {
      const checked = fs.querySelector('input:checked');
      if (checked) options.push(String(checked.value || ''));
    });
    root.querySelectorAll('variant-selects select[name^="options"]').forEach(function (sel) {
      options.push(String(sel.value || ''));
    });

    const names = getCustomilyTextInputs()
      .map(function (input) {
        return String(input.value || '');
      })
      .join('\u0001');

    return variantId + '\u0002' + options.join('\u0001') + '\u0002' + names;
  }

  function forgetCustomilyPreviewSrc() {
    window.__myprintsyLastCustomilyPreviewSrc = '';
    window.__myprintsyLastCustomilyPreviewKey = '';
  }

  /**
   * Remember Preview-modal URL only. Cleared when pack or name changes.
   * cart-notification reads via __myprintsyGetValidRememberedPreviewSrc.
   */
  function rememberCustomilyPreviewSrc(src) {
    const url = String(src || '');
    if (!url || url.indexOf('data:') === 0 || url.indexOf('blob:') === 0) return;
    if (!isCustomilyMediaSrc(url) && !/\/previews?\//i.test(url)) return;
    window.__myprintsyLastCustomilyPreviewSrc = url;
    window.__myprintsyLastCustomilyPreviewKey = getPreviewPersonalizationKey();
  }

  function getValidRememberedPreviewSrc() {
    const url = String(window.__myprintsyLastCustomilyPreviewSrc || '');
    if (!url) return '';
    if (String(window.__myprintsyLastCustomilyPreviewKey || '') !== getPreviewPersonalizationKey()) {
      forgetCustomilyPreviewSrc();
      return '';
    }
    return url;
  }
  window.__myprintsyGetValidRememberedPreviewSrc = getValidRememberedPreviewSrc;
  window.__myprintsyForgetCustomilyPreviewSrc = forgetCustomilyPreviewSrc;

  function upgradeModalPreviewImage(host) {
    if (!host) return;
    const imgs = host.querySelectorAll(
      '.cl-preview-image, .cl-preview-wrapper img, .main > img, img[src*="customily" i], img[src*="preview" i]'
    );
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i];
      const raw = String(img.currentSrc || img.getAttribute('src') || '');
      if (!raw || raw.indexOf('data:') === 0) continue;

      let next = raw;
      // Prefer full preview asset over thumbnail paths when Customily uses both.
      next = next
        .replace(/\/thumbnails?\//gi, '/previews/')
        .replace(/\/thumbs?\//gi, '/previews/')
        .replace(/([_-])thumb(nail)?([_.])/gi, '$1preview$3')
        .replace(/([?&])(w|width)=\d+/gi, '$1$2=1200')
        .replace(/([?&])(h|height)=\d+/gi, '$1$2=1200')
        .replace(/([?&])(q|quality)=\d+/gi, '$1$2=90');

      if (next !== raw) {
        img.setAttribute('src', next);
        img.removeAttribute('srcset');
      }

      rememberCustomilyPreviewSrc(next);
      img.setAttribute('decoding', 'async');
      img.style.setProperty('image-rendering', 'auto');
    }
  }

  function enhanceModal(modal, host) {
    modal.classList.add(STYLED_CLASS);
    host.classList.add('myprintsy-preview-modal__card');
    hideNativeClose(modal);
    upgradeModalPreviewImage(host);

    if (!host.querySelector('[' + CORNER_X_ATTR + ']')) {
      host.appendChild(buildCornerClose(modal));
    }

    if (host.querySelector('[' + ACTIONS_ATTR + ']')) {
      upgradeModalPreviewImage(host);
      return;
    }

    if (!host.querySelector('[' + HEADER_ATTR + ']')) {
      insertBeforePreview(host, buildHeader());
    }
    if (!host.querySelector('[' + TRUST_ATTR + ']')) {
      insertAfterPreview(host, buildTrust());
    }
    const trust = host.querySelector('[' + TRUST_ATTR + ']');
    const actions = buildActions(modal);
    if (trust && trust.parentNode) {
      if (trust.nextSibling) trust.parentNode.insertBefore(actions, trust.nextSibling);
      else trust.parentNode.appendChild(actions);
    } else {
      insertAfterPreview(host, actions);
    }
    upgradeModalPreviewImage(host);
  }

  function tryInject() {
    let found = false;
    for (let i = 0; i < MODAL_SELECTORS.length; i++) {
      document.querySelectorAll(MODAL_SELECTORS[i]).forEach(function (modal) {
        if (!isVisible(modal)) return;
        found = true;
        enhanceModal(modal, findHost(modal));
      });
    }
    return found;
  }

  function scheduleInject(attempts) {
    const maxAttempts = typeof attempts === 'number' ? attempts : 8;
    window.clearTimeout(injectTimer);
    let n = 0;
    function tick() {
      const ok = tryInject();
      n += 1;
      if (ok || n >= maxAttempts) return;
      injectTimer = window.setTimeout(tick, 200);
    }
    tick();
  }

  function stopWatching() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  }

  function watchForModalBriefly() {
    stopWatching();
    // Poll only â€” avoid MutationObserver on document.body (desktop Preview lag).
    scheduleInject(12);
    let n = 0;
    const stopAt = window.setInterval(function () {
      n += 1;
      if (tryInject() || n >= 20) {
        window.clearInterval(stopAt);
        stopWatching();
      }
    }, 250);
    window.setTimeout(function () {
      window.clearInterval(stopAt);
      stopWatching();
    }, 5000);
  }

  window.addEventListener(SHOW_EVENT, function () {
    scheduleInject(10);
    watchForModalBriefly();
  });

  document.addEventListener('click', function (event) {
    const previewBtn = event.target.closest(
      '#customily-preview-button, .customily-preview-button'
    );
    if (!previewBtn) return;
    window.setTimeout(function () {
      scheduleInject(10);
      watchForModalBriefly();
    }, 0);
  });

  // Optimistic cart-notification as soon as user taps Customily / theme ATC (capture).
  // Customily/option apps can swallow the click (required option untouched) — then no submit
  // and no /cart/add ever come; cart-notification's hang ceiling closes the popup.
  document.addEventListener(
    'click',
    function (event) {
      const atcBtn = event.target.closest(
        '#customily-cart-btn, button.add_to_cart, product-form .product-form__submit, product-form button[name="add"]'
      );
      if (!atcBtn) return;
      if (atcBtn.closest('.myprintsy-customily-preview-actions')) return; // handled in buildActions
      if (atcBtn.disabled || atcBtn.getAttribute('aria-disabled') === 'true') return;
      if (atcBtn.getAttribute('aria-busy') === 'true') return;
      openCartNotificationOptimistic();
    },
    true
  );

  /* ---- Macorner-style PDP button labels (Customily overwrites theme text) ---- */
  const PREVIEW_LABEL = 'Preview';
  const ATC_LABEL = 'Add to Cart';
  const CASE_STYLE_ID = 'myprintsy-atc-no-uppercase';
  const ICON_ATTR = 'data-myprintsy-btn-icon';
  const PREVIEW_BTN_SEL =
    '#customily-preview-button, .customily-preview-button, #btn-preview, #btn-preview-desktop, button[id*="preview" i]';
  const ATC_BTN_SEL =
    '#customily-cart-btn, button.add_to_cart, product-form .product-form__submit, product-form button[name="add"], form[action*="/cart/add"] button[name="add"]';

  function normalizeBtnText(text) {
    return String(text || '')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  function eyeIconEl() {
    const span = document.createElement('span');
    span.className = 'myprintsy-btn-icon';
    span.setAttribute(ICON_ATTR, 'preview');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">' +
      '<path d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<circle cx="12" cy="12" r="2.75" stroke="currentColor" stroke-width="1.75"/>' +
      '</svg>';
    return span;
  }

  function cartIconEl() {
    const span = document.createElement('span');
    span.className = 'myprintsy-btn-icon';
    span.setAttribute(ICON_ATTR, 'atc');
    span.setAttribute('aria-hidden', 'true');
    span.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">' +
      '<path d="M6 6h15l-1.5 9h-12L6 6Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
      '<path d="M6 6 5 3H2" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '<circle cx="9" cy="20" r="1.25" fill="currentColor"/>' +
      '<circle cx="17" cy="20" r="1.25" fill="currentColor"/>' +
      '<path d="M12 9v5M9.5 11.5H14.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>' +
      '</svg>';
    return span;
  }

  function ensureButtonIcon(btn, kind) {
    if (!btn) return;
    const existing = btn.querySelector('[' + ICON_ATTR + ']');
    if (existing) {
      if (existing.getAttribute(ICON_ATTR) === kind) {
        if (btn.firstElementChild !== existing) btn.insertBefore(existing, btn.firstChild);
        btn.classList.add('myprintsy-btn-with-icon');
        return;
      }
      existing.remove();
    }
    const icon = kind === 'preview' ? eyeIconEl() : cartIconEl();
    btn.insertBefore(icon, btn.firstChild);
    btn.classList.add('myprintsy-btn-with-icon');
  }

  function ensureNoUppercaseStyle() {
    let style = document.getElementById(CASE_STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = CASE_STYLE_ID;
      (document.head || document.documentElement).appendChild(style);
    }
    style.textContent =
      'button.add_to_cart,' +
      'button.add_to_cart .text,' +
      'button.add_to_cart .fadeInDown,' +
      'button.add_to_cart .fadeInDown.text,' +
      'button.add_to_cart span:not(.myprintsy-btn-icon),' +
      'button.add_to_cart div,' +
      '#customily-cart-btn,' +
      '#customily-cart-btn .text,' +
      '#customily-cart-btn span:not(.myprintsy-btn-icon),' +
      '#customily-cart-btn div,' +
      '.product-form__submit,' +
      '.product-form__submit span:not(.myprintsy-btn-icon),' +
      '.product-form__submit .text,' +
      'product-form button[name="add"],' +
      'product-form button[name="add"] span:not(.myprintsy-btn-icon),' +
      '#customily-preview-button,' +
      '.customily-preview-button{' +
      'text-transform:none!important;' +
      'font-size:16px!important;' +
      'font-weight:600!important;' +
      'letter-spacing:0.02rem!important;' +
      '}' +
      '.myprintsy-btn-with-icon{' +
      'display:inline-flex!important;' +
      'align-items:center!important;' +
      'justify-content:center!important;' +
      'gap:0.55rem!important;' +
      '}' +
      '.myprintsy-btn-icon{' +
      'display:inline-flex!important;' +
      'flex-shrink:0!important;' +
      'line-height:0!important;' +
      'color:inherit!important;' +
      '}' +
      '.myprintsy-btn-icon svg{display:block;width:18px;height:18px;}';
    if (style.parentNode) style.parentNode.appendChild(style);
  }

  function unlockCase(el) {
    if (!el || !el.style) return;
    el.style.setProperty('text-transform', 'none', 'important');
    el.style.setProperty('font-size', '16px', 'important');
    el.style.setProperty('font-weight', '600', 'important');
    const kids = el.querySelectorAll('.text, .fadeInDown, span, div');
    for (let i = 0; i < kids.length; i++) {
      if (kids[i].hasAttribute(ICON_ATTR)) continue;
      kids[i].style.setProperty('text-transform', 'none', 'important');
      kids[i].style.setProperty('font-size', '16px', 'important');
      kids[i].style.setProperty('font-weight', '600', 'important');
    }
  }

  function setLeafText(el, label) {
    if (!el) return false;
    const icon = el.querySelector('[' + ICON_ATTR + ']');
    const skip = 'svg, img, .loading__spinner, .loading-overlay__spinner, .spinner, [aria-hidden="true"], .myprintsy-btn-icon';
    const preferred = el.querySelector('.text, .fadeInDown.text');
    if (preferred && !preferred.querySelector('svg, img, .loading__spinner') && !preferred.hasAttribute(ICON_ATTR)) {
      if (preferred.textContent !== label) preferred.textContent = label;
      unlockCase(preferred);
      if (icon) el.insertBefore(icon, el.firstChild);
      return true;
    }
    const nodes = el.querySelectorAll('span, div, p, strong, b, label');
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (node.matches(skip) || node.closest(skip)) continue;
      if (node.hasAttribute(ICON_ATTR)) continue;
      if (node.querySelector('svg, img, .loading__spinner, .loading-overlay__spinner, .myprintsy-btn-icon')) continue;
      const t = normalizeBtnText(node.textContent);
      if (!t) continue;
      if (node.textContent !== label) node.textContent = label;
      unlockCase(node);
      if (icon) el.insertBefore(icon, el.firstChild);
      return true;
    }

    // Rebuild label while keeping icon + spinner.
    const spinner = el.querySelector('.loading__spinner, .loading-overlay__spinner');
    const keep = [];
    if (icon) keep.push(icon);
    const labelSpan = document.createElement('span');
    labelSpan.className = 'text';
    labelSpan.textContent = label;
    keep.push(labelSpan);
    if (spinner) keep.push(spinner);
    el.replaceChildren.apply(el, keep);
    unlockCase(el);
    return true;
  }

  function hideDuplicateAtcButtons() {
    const candidates = Array.from(document.querySelectorAll(ATC_BTN_SEL)).filter(function (btn) {
      if (btn.closest('.myprintsy-customily-preview-actions')) return false;
      if (btn.classList.contains('myprintsy-customily-preview-atc')) return false;
      return true;
    });
    if (candidates.length <= 1) {
      candidates.forEach(function (btn) {
        if (btn.getAttribute('data-myprintsy-atc-hidden') === '1') {
          btn.style.removeProperty('display');
          btn.removeAttribute('data-myprintsy-atc-hidden');
        }
      });
      return candidates[0] || null;
    }

    const keep =
      candidates.find(function (b) {
        return b.id === 'customily-cart-btn';
      }) ||
      candidates.find(function (b) {
        return b.classList.contains('add_to_cart');
      }) ||
      candidates[0];

    candidates.forEach(function (btn) {
      if (btn === keep) {
        btn.style.removeProperty('display');
        btn.removeAttribute('data-myprintsy-atc-hidden');
        return;
      }
      btn.style.setProperty('display', 'none', 'important');
      btn.setAttribute('data-myprintsy-atc-hidden', '1');
    });
    return keep;
  }

  function removePreviewButtonsForStaticGallery() {
    if (!markStaticShopifyGalleryChrome()) return;
    document.querySelectorAll(PREVIEW_BTN_SEL).forEach(function (btn) {
      if (btn.closest('.myprintsy-customily-preview-actions')) return;
      btn.remove();
    });
    document.getElementById('myprintsy-sticky-preview-dock')?.remove();
    document.getElementById('myprintsy-sticky-preview')?.remove();
  }

  function rewritePdpButtonLabels() {
    ensureNoUppercaseStyle();
    if (markStaticShopifyGalleryChrome()) {
      removePreviewButtonsForStaticGallery();
    }
    const keptAtc = hideDuplicateAtcButtons();

    if (!isStaticShopifyGalleryMode()) {
      document.querySelectorAll(PREVIEW_BTN_SEL).forEach(function (btn) {
        if (btn.id === 'myprintsy-sticky-preview' || btn.classList.contains('myprintsy-sticky-preview')) return;
        if (btn.closest('.myprintsy-customily-preview-actions')) return;
        const t = normalizeBtnText(btn.textContent);
        if (!t) return;
        if (t === 'preview' || t.includes('preview') || t.includes('personalization')) {
          if (t !== 'preview') setLeafText(btn, PREVIEW_LABEL);
          ensureButtonIcon(btn, 'preview');
          unlockCase(btn);
        }
      });
    }

    document.querySelectorAll(ATC_BTN_SEL).forEach(function (btn) {
      if (btn.closest('.myprintsy-customily-preview-actions')) return;
      if (btn.classList.contains('myprintsy-customily-preview-atc')) return;
      if (btn.getAttribute('data-myprintsy-atc-hidden') === '1') return;
      if (keptAtc && btn !== keptAtc) return;
      const t = normalizeBtnText(btn.textContent);
      if (!t) return;
      if (t.includes('sold out') || t.includes('unavailable')) return;
      if (t.includes('add to cart') || t.includes('add to bag')) {
        // no-customily: match Dawn "Add to cart" (lowercase c) — avoids Pack flicker vs "Add to Cart"
        const label = isStaticShopifyGalleryMode()
          ? window.variantStrings?.addToCart || 'Add to cart'
          : ATC_LABEL;
        setLeafText(btn, label);
        ensureButtonIcon(btn, 'atc');
        unlockCase(btn);
      }
    });
  }

  let labelObserver = null;
  let labelTimer = null;

  function isTypingInCustomily() {
    const el = document.activeElement;
    if (!el || el === document.body) return false;
    return !!(
      el.closest &&
      el.closest(
        '.customily_option, #customily-options, #cl_optionsapp, #custom-options, [id*="customily" i] input, [id*="customily" i] textarea'
      )
    );
  }

  function isInsideCustomilyOptions(node) {
    if (!node) return false;
    const el = node.nodeType === 3 ? node.parentElement : node;
    if (!el || !el.closest) return false;
    return !!el.closest(
      '.customily_option, #customily-options, #cl_optionsapp, #custom-options'
    );
  }

  function scheduleLabelRewrite() {
    if (window.__myprintsyPdpUpdating || isTypingInCustomily()) return;
    window.clearTimeout(labelTimer);
    labelTimer = window.setTimeout(function () {
      if (window.__myprintsyPdpUpdating || isTypingInCustomily()) return;
      rewritePdpButtonLabels();
      ensurePersonalizedOptionsTitle();
      ensureQuantityAbovePreview();
    }, 120);
  }

  /** Heading above Customily personalization fields (GUI only). */
  function ensurePersonalizedOptionsTitle() {
    if (document.querySelector('[data-myprintsy-personalized-title]')) return;
    const option = document.querySelector('.customily_option');
    if (!option || !option.parentElement) return;
    const host = option.parentElement;
    const title = document.createElement('div');
    title.className = 'myprintsy-personalized-options-title';
    title.setAttribute('data-myprintsy-personalized-title', '');
    title.textContent = 'Personalized Options';
    host.insertBefore(title, host.firstChild);
  }

  /**
   * Theme renders Quantity before Buy buttons; Customily injects options after Quantity.
   * Desired: Personalized Options → Quantity → Preview / ATC.
   * IMPORTANT: never nest Quantity inside Preview/ATC wrappers (breaks +/- UI).
   */
  function ensureQuantityAbovePreview() {
    if (window.__myprintsyPdpUpdating) return;

    const qty = document.querySelector(
      'product-info .product-form__quantity, .product__info-container .product-form__quantity'
    );
    if (!qty) return;

    const personalization =
      document.querySelector('#customily-options, #cl_optionsapp, #custom-options') ||
      document.querySelector('.product-form__custom-texts');

    if (!personalization || !personalization.parentNode) return;

    // Already right after options as a safe sibling.
    if (personalization.nextElementSibling === qty) {
      qty.setAttribute('data-myprintsy-qty-placed', '1');
      return;
    }

    try {
      // Sibling after Personalized Options — never inside .product-form__buttons.
      personalization.parentNode.insertBefore(qty, personalization.nextSibling);
      qty.setAttribute('data-myprintsy-qty-placed', '1');
    } catch (_) {}
  }

  function startLabelWatch() {
    fillPdpTrustBuyers();
    rewritePdpButtonLabels();
    ensurePersonalizedOptionsTitle();
    ensureQuantityAbovePreview();
    if (labelObserver) return;
    labelObserver = new MutationObserver(function (mutations) {
      // Variant swap / typing: skip â€” rewrite here janks Size/Option/Pack clicks.
      if (window.__myprintsyPdpUpdating || isTypingInCustomily()) return;
      let relevant = false;
      for (let i = 0; i < mutations.length; i++) {
        const m = mutations[i];
        if (isInsideCustomilyOptions(m.target)) continue;
        if (m.addedNodes && m.addedNodes.length) {
          let skip = true;
          for (let j = 0; j < m.addedNodes.length; j++) {
            if (!isInsideCustomilyOptions(m.addedNodes[j])) {
              skip = false;
              break;
            }
          }
          if (skip) continue;
        }
        relevant = true;
        break;
      }
      if (!relevant) return;
      scheduleLabelRewrite();
    });
    // Scope to product-info (fallback main) â€” body-wide MO + variant swap = click lag.
    const labelRoot =
      document.querySelector('product-info') ||
      document.querySelector('main') ||
      document.body;
    labelObserver.observe(labelRoot, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
    // Customily CDN CSS/JS can land late â€” keep correcting (skip while typing / updating).
    window.setInterval(function () {
      if (window.__myprintsyPdpUpdating || isTypingInCustomily()) return;
      rewritePdpButtonLabels();
      ensurePersonalizedOptionsTitle();
      ensureQuantityAbovePreview();
    }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startLabelWatch);
  } else {
    startLabelWatch();
  }
  window.addEventListener('load', function () {
    fillPdpTrustBuyers();
    rewritePdpButtonLabels();
    scheduleLabelRewrite();
    window.setTimeout(function () {
      rewritePdpButtonLabels();
      ensureQuantityAbovePreview();
    }, 800);
    window.setTimeout(function () {
      rewritePdpButtonLabels();
      ensureQuantityAbovePreview();
    }, 1500);
    window.setTimeout(function () {
      rewritePdpButtonLabels();
      ensureQuantityAbovePreview();
    }, 4000);
  });

  /* ---- Mobile sticky Preview (Macorner-style) ---- */
  const STICKY_ID = 'myprintsy-sticky-preview';
  const STICKY_DOCK_ID = 'myprintsy-sticky-preview-dock';
  const MOBILE_MQ = '(max-width: 749px)';
  let stickyBtn = null;
  let stickyDock = null;
  let stickyIo = null;
  let stickyObserved = null;
  let stickyScrolledPastPreview = false;
  let stickyFindTimer = null;
  let stickyUpdating = false;

  function isMobileViewport() {
    return window.matchMedia(MOBILE_MQ).matches;
  }

  function lockThemeColorWhite() {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    if (meta.getAttribute('content') !== '#ffffff') {
      meta.setAttribute('content', '#ffffff');
    }
  }

  function findPrimaryPreviewButton() {
    const nodes = Array.from(document.querySelectorAll(PREVIEW_BTN_SEL));
    for (let i = 0; i < nodes.length; i++) {
      const btn = nodes[i];
      if (btn.id === STICKY_ID || btn.classList.contains('myprintsy-sticky-preview')) continue;
      if (btn.closest('.myprintsy-customily-preview-actions')) continue;
      if (!isVisible(btn)) continue;
      return btn;
    }
    return (
      document.querySelector('#customily-preview-button') ||
      document.querySelector('.customily-preview-button') ||
      null
    );
  }

  function isPreviewModalOpen() {
    for (let i = 0; i < MODAL_SELECTORS.length; i++) {
      const modal = document.querySelector(MODAL_SELECTORS[i]);
      if (isVisible(modal)) return true;
    }
    return false;
  }

  /** Shopify Inbox open (teaser / full panel) â€” hide sticky Preview so it doesn't sit on chat. */
  function isShopifyChatOpen() {
    const el =
      document.querySelector('#ShopifyChat') ||
      document.querySelector('inbox-online-store-chat');
    if (!el) return false;

    if (el.getAttribute('aria-expanded') === 'true') return true;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    if (el.hasAttribute('open') || el.getAttribute('data-open') === 'true') return true;

    const vh = window.innerHeight || 0;
    const vw = window.innerWidth || 0;

    function isLargePanel(node) {
      if (!node || !node.getBoundingClientRect) return false;
      const r = node.getBoundingClientRect();
      return r.height >= Math.min(vh * 0.35, 240) && r.width >= Math.min(vw * 0.55, 220);
    }

    if (isLargePanel(el)) return true;

    try {
      if (el.shadowRoot) {
        const nodes = el.shadowRoot.querySelectorAll('*');
        for (let i = 0; i < nodes.length; i++) {
          if (isLargePanel(nodes[i])) return true;
        }
        // Closed bubble is small; iframe / dialog inside shadow often marks open UI
        const dialog = el.shadowRoot.querySelector(
          '[role="dialog"], iframe, [class*="window"], [class*="Window"], [class*="chat-"]'
        );
        if (dialog && isLargePanel(dialog)) return true;
      }
    } catch (_) {
      /* ignore closed shadow */
    }

    // Fallback: any large fixed node under chat host / shopify-chat wrappers
    const wrappers = document.querySelectorAll(
      '#ShopifyChat, #shopify-chat, inbox-online-store-chat, [id*="ShopifyChat"]'
    );
    for (let w = 0; w < wrappers.length; w++) {
      const kids = wrappers[w].querySelectorAll('*');
      for (let k = 0; k < kids.length; k++) {
        const cs = getComputedStyle(kids[k]);
        if ((cs.position === 'fixed' || cs.position === 'absolute') && isLargePanel(kids[k])) {
          return true;
        }
      }
    }

    return false;
  }

  /** True only after scrolling past native Preview (button is above the viewport). */
  function computeScrolledPastPreview(btn) {
    if (!btn) return false;
    const rect = btn.getBoundingClientRect();
    return rect.bottom < 0;
  }

  function ensureStickyPreviewButton() {
    if (stickyBtn && document.body.contains(stickyBtn) && stickyDock && document.body.contains(stickyDock)) {
      return stickyBtn;
    }

    stickyDock = document.getElementById(STICKY_DOCK_ID);
    stickyBtn = document.getElementById(STICKY_ID);

    if (!stickyDock) {
      stickyDock = document.createElement('div');
      stickyDock.id = STICKY_DOCK_ID;
      stickyDock.className = 'myprintsy-sticky-preview-dock';
      stickyDock.setAttribute('aria-hidden', 'true');
      document.body.appendChild(stickyDock);
    }

    if (!stickyBtn) {
      stickyBtn = document.createElement('button');
      stickyBtn.type = 'button';
      stickyBtn.id = STICKY_ID;
      stickyBtn.className = 'myprintsy-sticky-preview';
      stickyBtn.setAttribute('aria-label', 'Preview');
      stickyBtn.innerHTML =
        '<span class="myprintsy-sticky-preview__icon" aria-hidden="true">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">' +
        '<path d="M2.5 12s3.6-7 9.5-7 9.5 7 9.5 7-3.6 7-9.5 7-9.5-7-9.5-7Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>' +
        '<circle cx="12" cy="12" r="2.75" stroke="currentColor" stroke-width="1.75"/>' +
        '</svg></span>' +
        '<span>Preview</span>';

      stickyBtn.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const target = findPrimaryPreviewButton();
        if (target) target.click();
      });
    }

    if (stickyBtn.parentElement !== stickyDock) stickyDock.appendChild(stickyBtn);
    return stickyBtn;
  }

  function updateStickyPreviewVisibility() {
    if (stickyUpdating) return;
    stickyUpdating = true;
    try {
      ensureStickyPreviewButton();
      lockThemeColorWhite();
      const nativePreview = findPrimaryPreviewButton();
      stickyScrolledPastPreview = nativePreview
        ? computeScrolledPastPreview(nativePreview)
        : false;
      const chatOpen = isShopifyChatOpen();
      const canShow =
        isMobileViewport() &&
        stickyScrolledPastPreview &&
        !!nativePreview &&
        !isPreviewModalOpen() &&
        !chatOpen;
      const nextHidden = canShow ? 'false' : 'true';
      document.body.classList.toggle('myprintsy-chat-open', chatOpen);
      if (stickyDock.classList.contains('is-visible') !== canShow) {
        stickyDock.classList.toggle('is-visible', canShow);
      }
      if (stickyDock.getAttribute('aria-hidden') !== nextHidden) {
        stickyDock.setAttribute('aria-hidden', nextHidden);
      }
      if (stickyBtn.getAttribute('aria-hidden') !== nextHidden) {
        stickyBtn.setAttribute('aria-hidden', nextHidden);
      }
    } finally {
      stickyUpdating = false;
    }
  }

  function observePrimaryPreview(btn) {
    if (!btn || stickyObserved === btn) return;
    if (stickyIo) stickyIo.disconnect();
    stickyObserved = btn;
    stickyIo = new IntersectionObserver(
      function () {
        updateStickyPreviewVisibility();
      },
      { root: null, threshold: 0, rootMargin: '0px' }
    );
    stickyIo.observe(btn);
    updateStickyPreviewVisibility();
  }

  function syncStickyPreviewTarget() {
    const btn = findPrimaryPreviewButton();
    if (btn) observePrimaryPreview(btn);
    updateStickyPreviewVisibility();
  }

  function watchShopifyChatForSticky() {
    // Sticky Preview chá»‰ mobile â€” Ä‘á»«ng poll/observer trÃªn desktop (gÃ¢y jank khi Preview).
    if (!isMobileViewport()) return;

    let chatWatched = null;
    function attach(el) {
      if (!el || chatWatched === el) return;
      chatWatched = el;
      try {
        new MutationObserver(function () {
          updateStickyPreviewVisibility();
        }).observe(el, { attributes: true, childList: true, subtree: true });
        if (el.shadowRoot) {
          new MutationObserver(function () {
            updateStickyPreviewVisibility();
          }).observe(el.shadowRoot, { attributes: true, childList: true, subtree: true });
        }
      } catch (_) {
        /* ignore */
      }
      updateStickyPreviewVisibility();
    }
    function findChat() {
      attach(
        document.querySelector('#ShopifyChat') ||
          document.querySelector('inbox-online-store-chat')
      );
    }
    findChat();
    let n = 0;
    const iv = window.setInterval(function () {
      findChat();
      updateStickyPreviewVisibility();
      n += 1;
      if (n >= 40) window.clearInterval(iv);
    }, 700);
    document.addEventListener(
      'click',
      function (event) {
        if (!isMobileViewport()) return;
        const t = event.target;
        if (
          !(
            t &&
            (t.closest('#ShopifyChat') ||
              t.closest('inbox-online-store-chat') ||
              t.closest('#shopify-chat'))
          )
        ) {
          return;
        }
        window.setTimeout(updateStickyPreviewVisibility, 50);
        window.setTimeout(updateStickyPreviewVisibility, 300);
      },
      true
    );
  }

  function startStickyPreviewWatch() {
    if (markStaticShopifyGalleryChrome()) return;
    ensureStickyPreviewButton();
    syncStickyPreviewTarget();
    watchShopifyChatForSticky();

    window.addEventListener('resize', updateStickyPreviewVisibility);
    window.addEventListener('scroll', updateStickyPreviewVisibility, { passive: true });
    window.addEventListener(SHOW_EVENT, function () {
      window.setTimeout(updateStickyPreviewVisibility, 50);
    });

    // Customily Preview mounts late â€” poll briefly (no body MutationObserver:
    // observing class/style + label rewriter caused a main-thread freeze).
    stickyFindTimer = window.setInterval(syncStickyPreviewTarget, 1000);
    window.setTimeout(function () {
      window.clearInterval(stickyFindTimer);
      stickyFindTimer = null;
    }, 20000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startStickyPreviewWatch);
  } else {
    startStickyPreviewWatch();
  }

  /* ---- Gallery: hide Shopify base only under a READY Customily overlay img ---- */
  /* Every viewport pins the Shopify photo. Mobile used to show Customily's live
     gallery render, which repaints ~2x slower there (0.45s vs 0.24s measured) and
     slower still on real phone CPUs. Keep in sync with the pin block in
     customily-preview-atc.css (see scripts/check-gallery-pin-viewport.js). */
  const DESKTOP_GALLERY_MQ = '(min-width: 0px)';

  function isDesktopGalleryViewport() {
    return window.matchMedia(DESKTOP_GALLERY_MQ).matches;
  }

  function isCustomilyOverlayImgReady(img) {
    if (!img || img.tagName !== 'IMG') return false;
    const src = String(img.currentSrc || img.src || '');
    const cls = String(img.className || '');
    const isCustomily = /customily|cl-preview/i.test(src) || /cl-preview|customily/i.test(cls);
    if (!isCustomily) return false;
    return img.complete && img.naturalWidth > 40 && img.naturalHeight > 40;
  }

  function unhideMediaAncestors(img) {
    if (!img || !isDesktopGalleryViewport()) return;
    const media = img.closest('.media');
    if (!media) return;
    let el = img.parentElement;
    while (el && el !== media) {
      try {
        el.style.setProperty('opacity', '1', 'important');
        el.style.setProperty('visibility', 'visible', 'important');
        el.style.setProperty('z-index', '3', 'important');
        el.removeAttribute('hidden');
        if (window.getComputedStyle(el).display === 'none') {
          el.style.setProperty('display', 'block', 'important');
        }
      } catch (_) {}
      el = el.parentElement;
    }
  }

  function forceShopifyBaseVisible(img) {
    if (!img) return;
    try {
      img.style.setProperty('opacity', '1', 'important');
      img.style.setProperty('visibility', 'visible', 'important');
      img.style.setProperty('display', 'block', 'important');
      if (isDesktopGalleryViewport()) {
        img.style.setProperty('z-index', '5', 'important');
        img.style.setProperty('position', 'absolute', 'important');
        img.style.setProperty('inset', '0', 'important');
        img.style.setProperty('width', '100%', 'important');
        img.style.setProperty('height', '100%', 'important');
        img.style.setProperty('object-fit', 'contain', 'important');
      }
      img.removeAttribute('hidden');
      if (img.style.display === 'none') img.style.removeProperty('display');
    } catch (_) {}
    unhideMediaAncestors(img);
  }

  let cachedShopifyGallerySrc = '';

  function rememberShopifySrc(img) {
    if (!img) return;
    const src = String(img.getAttribute('src') || img.currentSrc || img.src || '');
    if (!isShopifyCdnSrc(src)) return;
    if (!img.dataset.myprintsyShopifySrc) {
      img.dataset.myprintsyShopifySrc = src;
      if (img.getAttribute('srcset')) {
        img.dataset.myprintsyShopifySrcset = img.getAttribute('srcset');
      }
    }
    if (!cachedShopifyGallerySrc) {
      cachedShopifyGallerySrc = img.dataset.myprintsyShopifySrc || src;
    }
  }

  function captureInitialShopifySrc() {
    document
      .querySelectorAll(
        'product-info .product__media-wrapper img, media-gallery .thumbnail img, .thumbnail-list img'
      )
      .forEach(rememberShopifySrc);
  }

  function galleryMediaImgs(media) {
    return Array.from(media.querySelectorAll('img')).filter(function (img) {
      return !img.closest('.thumbnail, .thumbnail-list, .product-media-modal, product-modal');
    });
  }

  function getShopifyFallbackSrc(media) {
    if (cachedShopifyGallerySrc) return cachedShopifyGallerySrc;
    if (media) {
      const local = galleryMediaImgs(media);
      for (let i = 0; i < local.length; i++) {
        if (local[i].dataset.myprintsyShopifySrc) return local[i].dataset.myprintsyShopifySrc;
        const src = String(local[i].getAttribute('src') || local[i].src || '');
        if (isShopifyCdnSrc(src)) return src;
      }
    }
    const thumbs = document.querySelectorAll(
      'media-gallery .thumbnail img, .thumbnail-list img, product-info .product__media-wrapper img'
    );
    for (let i = 0; i < thumbs.length; i++) {
      const src = String(thumbs[i].getAttribute('src') || thumbs[i].src || '');
      if (isShopifyCdnSrc(src)) return src;
    }
    return '';
  }

  /**
   * Pin Shopify photo on the media CONTAINER (outside .media).
   * Customily owns .media and eats fallbacks placed there on Pack+name reload.
   * Pack click “fixes” it because variantChange rebuilds media — reload does not.
   */
  function ensureDesktopShopifyFallback(media) {
    if (!isDesktopGalleryViewport()) return;
    const host = (media && media.closest('.product-media-container')) || media;
    if (!host) return;
    const src = getShopifyFallbackSrc(media);
    if (!src) return;

    if (media) {
      media.querySelectorAll('img.myprintsy-shopify-fallback').forEach(function (el) {
        if (el.parentElement !== host) el.remove();
      });
    }

    let fb = host.querySelector(':scope > img.myprintsy-shopify-fallback');
    if (!fb) {
      fb = document.createElement('img');
      fb.className = 'myprintsy-shopify-fallback';
      fb.alt = '';
      fb.decoding = 'async';
      fb.setAttribute('aria-hidden', 'true');
    }
    if (fb.parentNode !== host) host.appendChild(fb);
    if (fb.getAttribute('src') !== src) fb.setAttribute('src', src);
    fb.dataset.myprintsyShopifySrc = src;
    try {
      fb.style.setProperty('opacity', '1', 'important');
      fb.style.setProperty('visibility', 'visible', 'important');
      fb.style.setProperty('display', 'block', 'important');
      fb.style.setProperty('z-index', '4', 'important');
      fb.style.setProperty('position', 'absolute', 'important');
      fb.style.setProperty('inset', '0', 'important');
      fb.style.setProperty('width', '100%', 'important');
      fb.style.setProperty('height', '100%', 'important');
      fb.style.setProperty('object-fit', 'contain', 'important');
      fb.style.setProperty('pointer-events', 'none', 'important');
    } catch (_) {}
  }

  function pinDesktopShopifyPhoto() {
    if (!isDesktopGalleryViewport()) return;
    captureInitialShopifySrc();
    const roots = document.querySelectorAll(
      'product-info .product__media-wrapper .product-media-container, media-gallery .product-media-container'
    );
    for (let i = 0; i < roots.length; i++) {
      const media = roots[i].querySelector('.media') || roots[i];
      ensureDesktopShopifyFallback(media);
    }
  }

  function isLiveKlaviyoContext(el) {
    if (!el || !el.closest) return false;
    if (el.closest('.cart-reminder-popup.is-open, footer, .newsletter, .klaviyo-form-Yy9PSK')) {
      return true;
    }
    const host = el.closest('cart-reminder-popup');
    return !!(host && host.querySelector('.cart-reminder-popup.is-open'));
  }

  function restoreKlaviyoEl(el) {
    if (!el || !el.style) return;
    [
      'pointer-events',
      'z-index',
      'position',
      'left',
      'right',
      'bottom',
      'top',
      'transform',
      'visibility',
      'max-height',
      'overflow',
    ].forEach(function (prop) {
      el.style.removeProperty(prop);
    });
  }

  function parkGhostKlaviyoEl(el) {
    if (!el || !el.style) return;
    el.style.setProperty('pointer-events', 'none', 'important');
    el.style.setProperty('z-index', '-9999', 'important');
    if (
      el.matches(
        'form.klaviyo-form, form.klaviyo-form.needsclick, form.klaviyo-form-version-cid_1, button.klaviyo-form-button'
      )
    ) {
      el.style.setProperty('position', 'fixed', 'important');
      el.style.setProperty('left', '0', 'important');
      el.style.setProperty('right', '0', 'important');
      el.style.setProperty('bottom', '0', 'important');
      el.style.setProperty('top', 'auto', 'important');
      el.style.setProperty('transform', 'translateY(100%)', 'important');
      el.style.setProperty('visibility', 'hidden', 'important');
      el.style.setProperty('max-height', '0', 'important');
      el.style.setProperty('overflow', 'hidden', 'important');
    }
  }

  function disarmGhostKlaviyoForms() {
    document
      .querySelectorAll(
        'form.klaviyo-form, button.klaviyo-form-button, div[class*="klaviyo-form-"], [data-klaviyo-embed-slot], [data-klaviyo-prerender]'
      )
      .forEach(function (el) {
        if (el.classList && el.classList.contains('klaviyo-form-Yy9PSK')) return;
        if (isLiveKlaviyoContext(el)) {
          restoreKlaviyoEl(el);
          return;
        }
        parkGhostKlaviyoEl(el);

        let wrap = el.parentElement;
        let hops = 0;
        while (wrap && wrap !== document.body && hops < 8) {
          if (isLiveKlaviyoContext(wrap)) break;
          const cs = window.getComputedStyle(wrap);
          const r = wrap.getBoundingClientRect();
          const isPositioned = cs.position === 'fixed' || cs.position === 'absolute';
          const overlapsFormColumn =
            r.width > 180 &&
            r.height > 60 &&
            r.left < window.innerWidth * 0.72 &&
            r.top < window.innerHeight * 0.72 &&
            r.bottom > 80;
          const isKlaviyoWrap =
            wrap.matches?.(
              '[data-klaviyo-embed-slot], [data-klaviyo-prerender], [class*="klaviyo-form-"], cart-reminder-popup'
            ) || wrap.querySelector?.('form.klaviyo-form, button.klaviyo-form-button');

          if (isKlaviyoWrap && (isPositioned || overlapsFormColumn)) {
            wrap.style.setProperty('pointer-events', 'none', 'important');
            wrap.style.setProperty('z-index', '-9999', 'important');
            if (!wrap.closest('.cart-reminder-popup.is-open')) {
              wrap.style.setProperty('visibility', 'hidden', 'important');
              wrap.style.setProperty('max-height', '0', 'important');
              wrap.style.setProperty('overflow', 'hidden', 'important');
            }
          }
          wrap = wrap.parentElement;
          hops += 1;
        }
      });
  }

  let klaviyoDisarmObserver = null;
  let klaviyoDisarmTimer = null;

  function startGhostKlaviyoWatch() {
    disarmGhostKlaviyoForms();
    if (klaviyoDisarmObserver) return;
    klaviyoDisarmObserver = new MutationObserver(function () {
      if (document.querySelector('product-form .product-form__submit.loading')) return;
      window.clearTimeout(klaviyoDisarmTimer);
      klaviyoDisarmTimer = window.setTimeout(disarmGhostKlaviyoForms, 250);
    });
    klaviyoDisarmObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  function clearForcedBaseStyles(img) {
    if (!img) return;
    /* Desktop: never clear — blank Customily canvas must not replace the mug. */
    if (isDesktopGalleryViewport()) {
      forceShopifyBaseVisible(img);
      return;
    }
    try {
      img.style.removeProperty('opacity');
      img.style.removeProperty('visibility');
    } catch (_) {}
  }

  function demoteCustomilyLayersDesktop(media) {
    if (!media || !isDesktopGalleryViewport()) return;
    const scope = media.closest('.product-media-container') || media;
    scope.querySelectorAll('canvas').forEach(function (canvas) {
      try {
        canvas.style.setProperty('z-index', '0', 'important');
        canvas.style.setProperty('pointer-events', 'none', 'important');
        canvas.style.setProperty('background', 'transparent', 'important');
      } catch (_) {}
    });
    scope
      .querySelectorAll(
        'img.myprintsy-customily-overlay-img, img.cl-preview-image, img[src*="customily"]'
      )
      .forEach(function (img) {
        if (img.classList.contains('myprintsy-base-product-img') || img.classList.contains('myprintsy-shopify-fallback')) {
          return;
        }
        try {
          img.style.setProperty('z-index', '0', 'important');
          img.style.setProperty('pointer-events', 'none', 'important');
        } catch (_) {}
      });
  }

  function syncCustomilyGalleryOverlay() {
    if (window.__myprintsyPdpUpdating) return;

    if (markStaticShopifyGalleryChrome()) {
      const roots = document.querySelectorAll(
        'product-info .product__media-wrapper .product-media-container, media-gallery .product-media-container'
      );
      for (let i = 0; i < roots.length; i++) {
        const root = roots[i];
        root.classList.remove('myprintsy-has-customily-overlay');
        const media = root.querySelector('.media') || root;
        const imgs = Array.from(media.querySelectorAll('img'));
        imgs.forEach(function (img) {
          const src = String(img.currentSrc || img.src || '');
          const cls = String(img.className || '');
          const isCl =
            isCustomilyMediaSrc(src) || /cl-preview|customily/i.test(cls);

          if (!isCl && isShopifyCdnSrc(src) && !img.dataset.myprintsyShopifySrc) {
            img.dataset.myprintsyShopifySrc = img.getAttribute('src') || src;
            if (img.getAttribute('srcset')) {
              img.dataset.myprintsyShopifySrcset = img.getAttribute('srcset');
            }
          }

          if (isCl && img.dataset.myprintsyShopifySrc) {
            img.setAttribute('src', img.dataset.myprintsyShopifySrc);
            if (img.dataset.myprintsyShopifySrcset) {
              img.setAttribute('srcset', img.dataset.myprintsyShopifySrcset);
            }
            img.classList.remove('myprintsy-customily-overlay-img', 'cl-preview-image');
            img.classList.add('myprintsy-base-product-img');
            forceShopifyBaseVisible(img);
            return;
          }

          if (isCl) {
            img.classList.add('myprintsy-customily-overlay-img');
            img.style.setProperty('display', 'none', 'important');
            img.style.setProperty('opacity', '0', 'important');
            img.style.setProperty('visibility', 'hidden', 'important');
            return;
          }

          img.classList.remove('myprintsy-customily-overlay-img');
          img.classList.add('myprintsy-base-product-img');
          forceShopifyBaseVisible(img);
        });

        media.querySelectorAll('canvas').forEach(function (canvas) {
          canvas.style.setProperty('display', 'none', 'important');
          canvas.style.setProperty('opacity', '0', 'important');
          canvas.style.setProperty('visibility', 'hidden', 'important');
        });
      }
      return;
    }

    const roots = document.querySelectorAll(
      'product-info .product__media-wrapper .product-media-container, media-gallery .product-media-container'
    );
    const desktop = isDesktopGalleryViewport();

    for (let i = 0; i < roots.length; i++) {
      const root = roots[i];
      const media = root.querySelector('.media') || root;
      const directImgs = Array.from(media.children).filter(function (el) {
        return el.tagName === 'IMG';
      });
      const list = directImgs.length
        ? directImgs
        : Array.from(media.querySelectorAll('img')).filter(function (img) {
            return img.closest('.media') === media || media.contains(img);
          });

      list.forEach(function (img) {
        img.classList.remove('myprintsy-base-product-img', 'myprintsy-customily-overlay-img');
      });

      /* Desktop Pack+name reload: Customily paints text-only + hides Shopify.
         Keep any Shopify-CDN photo as base (ignore cl-preview class on it).
         If Customily replaced src, inject a fallback img from saved/thumbnail src. */
      if (desktop) {
        root.classList.remove('myprintsy-has-customily-overlay');
        const allImgs = galleryMediaImgs(media);
        allImgs.forEach(rememberShopifySrc);
        allImgs.forEach(function (img) {
          img.classList.remove('myprintsy-base-product-img', 'myprintsy-customily-overlay-img');
          const src = String(img.currentSrc || img.src || img.getAttribute('src') || '');
          const cls = String(img.className || '');
          const isBlobPreview = /^blob:|^data:/i.test(src);
          if (img.classList.contains('myprintsy-shopify-fallback') || (isShopifyCdnSrc(src) && !isBlobPreview)) {
            img.classList.remove('cl-preview-image');
            img.classList.add('myprintsy-base-product-img');
            forceShopifyBaseVisible(img);
            return;
          }
          if (isBlobPreview || isCustomilyMediaSrc(src) || /cl-preview|customily/i.test(cls)) {
            img.classList.add('myprintsy-customily-overlay-img');
            return;
          }
          img.classList.add('myprintsy-base-product-img');
          forceShopifyBaseVisible(img);
        });
        demoteCustomilyLayersDesktop(media);
        ensureDesktopShopifyFallback(media);
        continue;
      }

      let readyOverlay = false;
      list.forEach(function (img) {
        if (isCustomilyOverlayImgReady(img)) {
          readyOverlay = true;
          img.classList.add('myprintsy-customily-overlay-img');
        } else {
          const src = String(img.currentSrc || img.src || '');
          const cls = String(img.className || '');
          if (/customily|cl-preview/i.test(src) || /cl-preview|customily/i.test(cls)) {
            img.classList.add('myprintsy-customily-overlay-img');
          }
        }
      });

      list.forEach(function (img) {
        if (img.classList.contains('myprintsy-customily-overlay-img')) return;
        if (/customily|cl-preview/i.test(String(img.currentSrc || img.src || ''))) return;
        if (readyOverlay) {
          img.classList.add('myprintsy-base-product-img');
          clearForcedBaseStyles(img);
        } else {
          // One-shot rescue if Customily hid Shopify photo too early (reload blank).
          const cs = window.getComputedStyle(img);
          if (cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none') {
            forceShopifyBaseVisible(img);
          }
        }
      });

      root.classList.toggle('myprintsy-has-customily-overlay', readyOverlay);
    }
  }

  function isCustomilyTextInput(el) {
    if (!el || !el.closest) return false;
    if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return false;
    if (el.type === 'hidden' || el.type === 'radio' || el.type === 'checkbox') return false;
    return !!el.closest(
      '#customily-options, #cl_optionsapp, #custom-options, .customily_option'
    );
  }

  function getCustomilyHosts() {
    return Array.from(
      document.querySelectorAll('#customily-options, #cl_optionsapp, #custom-options')
    );
  }

  function getCustomilyTextInputs() {
    return Array.from(
      document.querySelectorAll(
        '#customily-options input, #cl_optionsapp input, #custom-options input, .customily_option input, #customily-options textarea, #cl_optionsapp textarea, #custom-options textarea, .customily_option textarea'
      )
    ).filter(function (input) {
      return input && input.type !== 'hidden' && input.type !== 'radio' && input.type !== 'checkbox';
    });
  }

  function isPackFieldset(el) {
    if (!el || !el.closest) return false;
    const fs = el.closest('variant-selects fieldset.product-form__input, variant-selects .product-form__input');
    if (!fs) return false;
    const legend = (fs.querySelector('legend, .form__label')?.textContent || '').toLowerCase();
    return legend.includes('buy more') || legend.includes('pack');
  }


  /**
   * Close Chrome autofill popup (browser UI — zoom 100% covers Pack, 80% may not).
   * Soft = blur+readonly only (safe on reload). Hard disable = Pack click only.
   */
  function dismissChromeAutofillHard(options) {
    const useDisable = !!(options && options.disable);
    getCustomilyTextInputs().forEach(function (input) {
      try {
        input.blur();
      } catch (_) {}
      input.dataset.myprintsyUserEdit = '';
      input.setAttribute('readonly', 'readonly');
      input.setAttribute('autocomplete', 'one-time-code');
      input.style.removeProperty('pointer-events');
      if (useDisable) {
        if (!input.dataset.myprintsyWasDisabled) {
          input.dataset.myprintsyWasDisabled = input.disabled ? '1' : '0';
        }
        input.disabled = true;
      }
    });

    window.requestAnimationFrame(function () {
      getCustomilyTextInputs().forEach(function (input) {
        if (useDisable) {
          input.disabled = input.dataset.myprintsyWasDisabled === '1';
          delete input.dataset.myprintsyWasDisabled;
        }
        if (input.dataset.myprintsyUserEdit === '1') return;
        input.setAttribute('readonly', 'readonly');
        input.setAttribute('autocomplete', 'one-time-code');
      });
    });
  }

  function unlockNameInputForTyping(input) {
    if (!input) return;
    lastNamePointerTs = Date.now();
    input.dataset.myprintsyUserEdit = '1';
    input.disabled = false;
    input.removeAttribute('readonly');
    // Never enable Chrome contact suggestions on Enter Name.
    input.setAttribute('autocomplete', 'one-time-code');
    input.style.removeProperty('pointer-events');
    try {
      input.focus({ preventScroll: true });
    } catch (_) {
      try {
        input.focus();
      } catch (_) {}
    }
  }

  /**
   * Keep Enter Name usable for typing, but never invite Chrome autofill suggestions.
   */
  function hardenCustomilyInputsAutocomplete() {
    document.querySelectorAll('form[action*="/cart/add"], product-form form, form.product-form').forEach(function (form) {
      form.setAttribute('autocomplete', 'off');
    });

    getCustomilyTextInputs().forEach(function (input) {
      input.setAttribute('autocomplete', 'one-time-code');
      input.setAttribute('autocorrect', 'off');
      input.setAttribute('autocapitalize', 'off');
      input.setAttribute('spellcheck', 'false');
      input.setAttribute('data-lpignore', 'true');
      input.setAttribute('data-1p-ignore', 'true');
      input.setAttribute('data-form-type', 'other');
      input.setAttribute('data-myprintsy-ac', '1');

      if (input.dataset.myprintsyUserEdit === '1') return;
      input.setAttribute('readonly', 'readonly');
    });
  }

  let packFreezeTimer = null;
  let lastPackPointerTs = 0;
  let lastNamePointerTs = 0;

  function armPackAutofillShield() {
    lastPackPointerTs = Date.now();
    window.__myprintsyPackClickTs = lastPackPointerTs;
    dismissChromeAutofillHard({ disable: true });
    window.clearTimeout(packFreezeTimer);
    packFreezeTimer = window.setTimeout(hardenCustomilyInputsAutocomplete, 400);
  }

  function startPreviewRememberInvalidation() {
    document.addEventListener(
      'change',
      function (e) {
        const t = e.target;
        if (!t || !t.closest) return;
        // Any variant (Pack/Size/Color) or Customily name → drop Preview cache.
        if (t.closest('variant-selects, variant-radios') || isCustomilyTextInput(t)) {
          forgetCustomilyPreviewSrc();
        }
      },
      true
    );
    document.addEventListener(
      'input',
      function (e) {
        if (isCustomilyTextInput(e.target)) forgetCustomilyPreviewSrc();
      },
      true
    );
  }

  function startPackClickDismissAutofill() {
    startPreviewRememberInvalidation();
    // Capture FIRST — unlock Enter Name before focusin can blur it (reload race).
    document.addEventListener(
      'pointerdown',
      function (e) {
        const t = e.target;
        if (!t || !t.closest) return;
        if (isCustomilyTextInput(t)) {
          unlockNameInputForTyping(t);
          return;
        }
        if (t.closest('variant-selects, variant-radios')) forgetCustomilyPreviewSrc();
        if (
          t.closest(
            'variant-selects .product-form__input, variant-selects label, variant-selects input[type="radio"], variant-selects legend'
          )
        ) {
          armPackAutofillShield();
        }
      },
      true
    );

    document.addEventListener(
      'touchstart',
      function (e) {
        const t = e.target;
        if (isCustomilyTextInput(t)) {
          unlockNameInputForTyping(t);
          return;
        }
        if (t.closest?.('variant-selects, variant-radios')) forgetCustomilyPreviewSrc();
        if (isPackFieldset(t) || t.closest?.('variant-selects')) armPackAutofillShield();
      },
      { capture: true, passive: true }
    );

    document.addEventListener(
      'focusin',
      function (e) {
        if (!isCustomilyTextInput(e.target)) return;
        // User just tapped this field — allow.
        if (e.target.dataset.myprintsyUserEdit === '1' || Date.now() - lastNamePointerTs < 600) return;
        // Pack click window — keep locked.
        if (Date.now() - lastPackPointerTs < 800) {
          e.target.setAttribute('readonly', 'readonly');
          e.target.setAttribute('autocomplete', 'one-time-code');
          try {
            e.target.blur();
          } catch (_) {}
          return;
        }
        // Programmatic focus from Customily on load — soft lock, no disable.
        e.target.setAttribute('readonly', 'readonly');
        e.target.setAttribute('autocomplete', 'one-time-code');
        try {
          e.target.blur();
        } catch (_) {}
      },
      true
    );

    document.addEventListener(
      'focusout',
      function (e) {
        if (!isCustomilyTextInput(e.target)) return;
        window.setTimeout(function () {
          if (document.activeElement === e.target) return;
          if (Date.now() - lastNamePointerTs < 300) return;
          e.target.dataset.myprintsyUserEdit = '';
          e.target.setAttribute('readonly', 'readonly');
          e.target.setAttribute('autocomplete', 'one-time-code');
        }, 150);
      },
      true
    );
  }

  let galleryMo = null;
  let galleryMoTimer = null;
  let gallerySyncGuard = false;

  function startDesktopShopifyGuard() {
    if (galleryMo) return;
    const root =
      document.querySelector('product-info .product__media-wrapper') ||
      document.querySelector('media-gallery');
    if (!root) return;
    galleryMo = new MutationObserver(function () {
      if (!isDesktopGalleryViewport() || window.__myprintsyPdpUpdating || gallerySyncGuard) return;
      window.clearTimeout(galleryMoTimer);
      galleryMoTimer = window.setTimeout(function () {
        if (gallerySyncGuard || window.__myprintsyPdpUpdating) return;
        gallerySyncGuard = true;
        try {
          syncCustomilyGalleryOverlay();
        } finally {
          window.setTimeout(function () {
            gallerySyncGuard = false;
          }, 120);
        }
      }, 60);
    });
    galleryMo.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'src', 'srcset', 'hidden'],
    });
  }

  function startCustomilyGalleryOverlayWatch() {
    captureInitialShopifySrc();
    pinDesktopShopifyPhoto();
    disarmGhostKlaviyoForms();
    startGhostKlaviyoWatch();
    syncCustomilyGalleryOverlay();
    startDesktopShopifyGuard();
    startPackClickDismissAutofill();
    hardenCustomilyInputsAutocomplete();
    // Soft lock only on load — never disable (that made Enter Name wait until “loaded”).
    window.setTimeout(hardenCustomilyInputsAutocomplete, 400);
    window.setTimeout(hardenCustomilyInputsAutocomplete, 1200);
    window.setTimeout(hardenCustomilyInputsAutocomplete, 3000);
    [0, 100, 300, 800, 1500, 2500, 4000, 7000].forEach(function (ms) {
      window.setTimeout(pinDesktopShopifyPhoto, ms);
    });
    let n = 0;
    const iv = window.setInterval(function () {
      if (document.querySelector('product-form .product-form__submit.loading')) {
        n += 1;
        if (n >= 80) window.clearInterval(iv);
        return;
      }
      pinDesktopShopifyPhoto();
      disarmGhostKlaviyoForms();
      if (window.__myprintsyPdpUpdating) {
        n += 1;
        if (n >= 80) window.clearInterval(iv);
        return;
      }
      if (isDesktopGalleryViewport() || !isTypingInCustomily()) {
        syncCustomilyGalleryOverlay();
      }
      if (!isTypingInCustomily()) hardenCustomilyInputsAutocomplete();
      n += 1;
      if (n >= 80) window.clearInterval(iv);
    }, 500);
    window.addEventListener('pageshow', pinDesktopShopifyPhoto);
    let galleryInputTimer = null;
    document.addEventListener(
      'input',
      function (e) {
        const t = e.target;
        if (
          !(
            t &&
            (t.closest('#customily-options') ||
              t.closest('#cl_optionsapp') ||
              t.closest('#custom-options') ||
              t.closest('.customily_option'))
          )
        ) {
          return;
        }
        window.clearTimeout(galleryInputTimer);
        galleryInputTimer = window.setTimeout(function () {
          if (isTypingInCustomily()) return;
          syncCustomilyGalleryOverlay();
        }, 500);
      },
      true
    );
    document.addEventListener(
      'focusout',
      function (e) {
        const t = e.target;
        if (
          t &&
          (t.closest('#customily-options') ||
            t.closest('#cl_optionsapp') ||
            t.closest('#custom-options') ||
            t.closest('.customily_option'))
        ) {
          window.setTimeout(syncCustomilyGalleryOverlay, 100);
        }
      },
      true
    );
    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.variantChange, function () {
        forgetCustomilyPreviewSrc();
        lastPackPointerTs = Date.now();
        dismissChromeAutofillHard({ disable: true });
        window.setTimeout(hardenCustomilyInputsAutocomplete, 500);
        window.setTimeout(pinDesktopShopifyPhoto, 50);
        window.setTimeout(syncCustomilyGalleryOverlay, 500);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCustomilyGalleryOverlayWatch);
  } else {
    startCustomilyGalleryOverlayWatch();
  }
})();
