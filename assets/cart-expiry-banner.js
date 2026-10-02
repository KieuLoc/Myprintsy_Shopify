(function () {
  const legacyStorageKey = 'myprintsy-cart-expiry-at';
  let expiryAt = null;
  let intervalId = null;

  // Drop old session persistence — refresh always starts at full duration
  try {
    sessionStorage.removeItem(legacyStorageKey);
  } catch (e) {
    /* ignore */
  }

  function getExpiryAt(minutes, forceReset) {
    if (forceReset || !expiryAt || expiryAt <= Date.now()) {
      expiryAt = Date.now() + minutes * 60 * 1000;
    }
    return expiryAt;
  }

  function renderRemaining(forceReset) {
    const banner = document.querySelector('[data-cart-expiry-banner]');
    const timerEl = banner?.querySelector('[data-cart-expiry-timer]');
    if (!banner || !timerEl) return;

    const minutes = Number(banner.dataset.expiryMinutes) || 10;
    const endAt = getExpiryAt(minutes, forceReset);
    const remainingMs = Math.max(0, endAt - Date.now());
    const totalSeconds = Math.ceil(remainingMs / 1000);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    timerEl.textContent = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
  }

  function start(options = {}) {
    const forceReset = options.reset === true;
    if (intervalId) window.clearInterval(intervalId);
    renderRemaining(forceReset);
    intervalId = window.setInterval(() => renderRemaining(false), 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => start({ reset: true }));
  } else {
    start({ reset: true });
  }

  // Cart AJAX re-renders banner HTML — keep same countdown, don't reset to 10:00
  document.addEventListener('cart:updated', () => start({ reset: false }));
  if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
    try {
      subscribe(PUB_SUB_EVENTS.cartUpdate, () => start({ reset: false }));
    } catch (e) {
      /* ignore */
    }
  }
})();
