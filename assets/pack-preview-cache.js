/**
 * Warm browser image cache for PDP / Customily pack previews.
 * Speeds up 2nd+ Pack clicks when the same image URLs are reused.
 * Does not change ATC / variant / Customily business logic.
 * Idle: after first GetProduct, warm preview image URLs found in JSON.
 */
(function initPackPreviewImageCache() {
  const warmed = new Set();
  const WARMED_MAX = 80;
  let collectTimer = null;
  const IMG_URL_RE = /https?:\/\/[^"'\\\s>]+\.(?:webp|png|jpe?g|gif)(?:\?[^"'\\\s>]*)?/gi;

  function normalizeUrl(raw) {
    if (!raw || typeof raw !== 'string') return null;
    if (raw.startsWith('data:') || raw.startsWith('blob:')) return null;
    try {
      const u = new URL(raw, window.location.origin);
      ['t', '_', 'cache', 'timestamp'].forEach((key) => {
        u.searchParams.delete(key);
      });
      return u.href;
    } catch (_) {
      return raw;
    }
  }

  function warmUrl(raw) {
    const url = normalizeUrl(raw);
    if (!url || warmed.has(url)) return;
    if (warmed.size >= WARMED_MAX) {
      const first = warmed.values().next().value;
      warmed.delete(first);
    }
    warmed.add(url);

    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';
    img.src = url;
  }

  function collectFromElement(root) {
    if (!root || root.nodeType !== 1) return;
    if (window.__myprintsyPdpUpdating) return;

    if (root.tagName === 'IMG') {
      warmUrl(root.currentSrc || root.src);
      if (root.srcset) {
        root.srcset.split(',').forEach((part) => {
          const candidate = part.trim().split(/\s+/)[0];
          warmUrl(candidate);
        });
      }
      return;
    }

    // Only direct/nearby imgs — avoid full-tree query on every Customily paint.
    const imgs = root.tagName === 'IMG' ? [root] : root.querySelectorAll?.(':scope > img, img');
    if (!imgs) return;
    const limit = Math.min(imgs.length, 12);
    for (let i = 0; i < limit; i++) {
      const img = imgs[i];
      warmUrl(img.currentSrc || img.src);
    }
  }

  function scheduleCollect(node) {
    if (window.__myprintsyPdpUpdating) return;
    window.clearTimeout(collectTimer);
    collectTimer = window.setTimeout(function () {
      if (window.__myprintsyPdpUpdating) return;
      collectFromElement(node);
    }, 200);
  }

  // When Customily / theme injects new images, warm them (debounced).
  const observer = new MutationObserver((mutations) => {
    if (window.__myprintsyPdpUpdating) return;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== 1) return;
        if (node.tagName === 'IMG' || node.querySelector?.('img')) scheduleCollect(node);
      });
      if (mutation.type === 'attributes' && mutation.target?.tagName === 'IMG') {
        scheduleCollect(mutation.target);
      }
    }
  });

  function start() {
    const root =
      document.querySelector('product-info') ||
      document.querySelector('media-gallery') ||
      document.querySelector('main');
    if (!root) return;
    // Scope to PDP — avoid body-wide observer (Customily DOM churn = desktop jank).
    observer.observe(root, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['src', 'srcset'],
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  function warmUrlsFromText(text) {
    if (!text || typeof text !== 'string') return;
    const matches = text.match(IMG_URL_RE);
    if (!matches) return;
    const limit = Math.min(matches.length, 20);
    for (let i = 0; i < limit; i++) warmUrl(matches[i]);
  }

  // Light GetProduct memory cache: same URL within session skips ~1s Customily round-trip.
  const productJsonCache = new Map();
  const PRODUCT_JSON_CACHE_MAX = 16;
  const ORIG_FETCH = window.fetch.bind(window);
  window.fetch = function patchedFetch(input, init) {
    const method = (init && init.method) || (typeof input !== 'string' && input?.method) || 'GET';
    if (String(method).toUpperCase() !== 'GET') return ORIG_FETCH(input, init);

    const url = typeof input === 'string' ? input : input?.url;
    if (!url || !/customily\.com\/api\/Product\/GetProduct/i.test(String(url))) {
      return ORIG_FETCH(input, init);
    }

    const key = String(url);
    if (productJsonCache.has(key)) {
      const cached = productJsonCache.get(key);
      return Promise.resolve(
        new Response(cached.body, {
          status: cached.status,
          statusText: cached.statusText,
          headers: cached.headers,
        })
      );
    }

    return ORIG_FETCH(input, init).then(async (res) => {
      try {
        const clone = res.clone();
        const body = await clone.text();
        if (productJsonCache.size >= PRODUCT_JSON_CACHE_MAX) {
          const oldest = productJsonCache.keys().next().value;
          productJsonCache.delete(oldest);
        }
        productJsonCache.set(key, {
          body,
          status: res.status,
          statusText: res.statusText,
          headers: res.headers,
        });
        // Idle-warm preview assets from payload (does not block response).
        const schedule =
          'requestIdleCallback' in window
            ? function (fn) {
                requestIdleCallback(fn, { timeout: 2500 });
              }
            : function (fn) {
                setTimeout(fn, 0);
              };
        schedule(function () {
          warmUrlsFromText(body);
        });
      } catch (_) {
        // ignore cache write failures
      }
      return res;
    });
  };
})();
