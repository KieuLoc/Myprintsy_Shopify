/**
 * Storefront-wide: discourage Chrome / password-manager autofill.
 * Checkout (Shopify hosted) is out of theme scope.
 * Does not change Customily business logic — only autocomplete attrs + brief readonly.
 */
(function () {
  const SKIP_TYPES = {
    hidden: 1,
    checkbox: 1,
    radio: 1,
    submit: 1,
    button: 1,
    file: 1,
    image: 1,
    reset: 1,
    range: 1,
    color: 1,
  };

  function isContactish(input) {
    const type = (input.getAttribute('type') || input.type || 'text').toLowerCase();
    const name = String(input.name || '');
    const id = String(input.id || '');
    const ac = String(input.getAttribute('autocomplete') || '');
    const ph = String(input.getAttribute('placeholder') || '');
    if (type === 'email' || type === 'tel') return true;
    if (/email|e-mail|phone|tel|mobile|address|firstname|lastname|full.?name|username/i.test(name + id + ac + ph))
      return true;
    if (/^(email|tel|name|username|street-address|postal-code|cc-)/i.test(ac)) return true;
    return false;
  }

  function isTypingTarget(el) {
    if (!el || !el.closest) return false;
    return !!el.closest(
      '.cart-reminder-popup, [data-klaviyo-embed-slot], form.klaviyo-form, .klaviyo-form-Yy9PSK, footer, .newsletter'
    );
  }

  function hardenInput(input) {
    if (!input || (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT'))
      return;
    if (input.hasAttribute('data-myprintsy-ac-off')) {
      // Re-assert — Chrome / widgets often reset autocomplete.
      if (input.tagName !== 'SELECT') {
        const type = (input.getAttribute('type') || input.type || 'text').toLowerCase();
        if (!SKIP_TYPES[type] && isContactish(input)) {
          input.setAttribute('autocomplete', 'new-password');
        } else if (!SKIP_TYPES[type]) {
          input.setAttribute('autocomplete', 'off');
        }
      }
      return;
    }

    if (input.tagName === 'SELECT') {
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('data-myprintsy-ac-off', '1');
      return;
    }

    const type = (input.getAttribute('type') || input.type || 'text').toLowerCase();
    if (SKIP_TYPES[type]) return;

    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('spellcheck', 'false');
    input.setAttribute('data-lpignore', 'true');
    input.setAttribute('data-1p-ignore', 'true');
    input.setAttribute('data-bwignore', 'true');
    input.setAttribute('data-form-type', 'other');
    input.setAttribute('data-myprintsy-ac-off', '1');

    // Chrome often ignores autocomplete=off on contact fields.
    if (isContactish(input) || type === 'password') {
      input.setAttribute('autocomplete', 'new-password');
      if (type === 'email') input.setAttribute('inputmode', 'email');
      if (type === 'tel') input.setAttribute('inputmode', 'tel');
    } else {
      input.setAttribute('autocomplete', 'off');
    }
  }

  function hardenAll(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll('input, textarea, select').forEach(hardenInput);
    scope.querySelectorAll('form').forEach(function (form) {
      form.setAttribute('autocomplete', 'off');
      form.setAttribute('data-myprintsy-ac-off', '1');
    });
  }

  /** Lock contact fields briefly so click/focus doesn't open Chrome address UI. */
  function suppressAutofillBurst(scopeRoot, exceptEl) {
    const root = scopeRoot && scopeRoot.querySelectorAll ? scopeRoot : document;
    const inputs = root.querySelectorAll('input, textarea');
    inputs.forEach(function (input) {
      if (exceptEl && (input === exceptEl || exceptEl.contains?.(input))) return;
      if (isTypingTarget(input)) return;
      hardenInput(input);
      if (!isContactish(input)) return;
      try {
        input.blur();
      } catch (_) {}
      if (!input.hasAttribute('readonly')) {
        input.setAttribute('readonly', 'readonly');
      }
    });
    // Contact fields stay readonly until focusin unlocks for typing.
  }

  function onFocusIn(e) {
    const input = e.target;
    if (!input || (input.tagName !== 'INPUT' && input.tagName !== 'TEXTAREA' && input.tagName !== 'SELECT'))
      return;
    hardenInput(input);
    if (input.hasAttribute('readonly') && input.tagName !== 'SELECT') {
      if (isTypingTarget(input)) {
        input.removeAttribute('readonly');
        return;
      }
      window.setTimeout(function () {
        input.removeAttribute('readonly');
      }, 40);
    }
  }

  function onPointerDown(e) {
    const t = e.target;
    if (!t || !t.closest) return;
    if (isTypingTarget(t)) return;
    const hit = t.closest(
      'a.jdgm-write-rev-link, .jdgm-write-rev-link, button.jdgm-write-rev-link,' +
        '[class*="write-rev"], [class*="write_rev"],' +
        '.jdgm-star, .jdgm-form__rating, .jdgm-rating,' +
        '[class*="jdgm-star"], [class*="jm-star"],' +
        '#judgeme_product_reviews button, #judgeme_product_reviews a'
    );
    if (!hit) return;
    suppressAutofillBurst(document, t);
    hardenAll(document);
  }

  let moTimer = null;
  function scheduleHarden() {
    window.clearTimeout(moTimer);
    moTimer = window.setTimeout(function () {
      hardenAll(document);
    }, 60);
  }

  function start() {
    hardenAll(document);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('focusin', onFocusIn, true);

    const mo = new MutationObserver(function () {
      if (document.querySelector('product-form .product-form__submit.loading')) return;
      scheduleHarden();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    [300, 1000, 2500, 5000, 10000].forEach(function (ms) {
      window.setTimeout(hardenAll, ms);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
