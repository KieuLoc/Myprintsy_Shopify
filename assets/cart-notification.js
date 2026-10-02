class CartNotification extends HTMLElement {
  constructor() {
    super();

    this.notification = document.getElementById('cart-notification');
    this.wrapper = this.querySelector('.cart-notification-wrapper');
    this.overlay = this.querySelector('[data-cart-notification-overlay]');
    this.header = document.querySelector('sticky-header');
    this.onBodyClick = this.handleBodyClick.bind(this);
    this._optimistic = false;
    /** User dismissed while ATC still in-flight — don't reopen on renderContents. */
    this._suppressNextOpen = false;
    this._ignoreBodyClickUntil = 0;
    this._bodyListenTimer = null;
    /** Single image URL for this ATC cycle — never swap after first paint. */
    this._lockedImageSrc = '';
    /** PDP price locked at ATC click — don't let cart final_price (extra discounts) overwrite. */
    this._lockedPriceText = '';
    this._checkoutCountdownTimer = null;
    this._checkoutHangTimer = null;
    this._checkoutGateUntilAdd = false;
    this._cartWatchTimer = null;
    this._cartWatchFingerprint = '';

    this.notification.addEventListener('keyup', (evt) => evt.code === 'Escape' && this.close());
    this.querySelectorAll('button[type="button"]').forEach((closeButton) =>
      closeButton.addEventListener('click', this.close.bind(this))
    );

    if (this.overlay) {
      this.overlay.addEventListener('click', this.close.bind(this));
    }

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartError, () => {
        this.closeOptimistic();
      });
      subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
        if (this._checkoutGateUntilAdd) this.resetCheckoutCountdownButton();
      });
    }
  }

  open() {
    this.mountModalToBody();
    if (this.wrapper) this.wrapper.classList.add('is-open');
    if (this.overlay) {
      this.overlay.hidden = false;
      this.overlay.classList.add('is-visible');
    }
    document.body.classList.add('cart-notification-open');

    this.notification.classList.add('animate', 'active');

    this.notification.addEventListener(
      'transitionend',
      () => {
        this.notification.focus();
        trapFocus(this.notification);
      },
      { once: true }
    );

    this._ignoreBodyClickUntil = Date.now() + 500;
    document.body.removeEventListener('click', this.onBodyClick);
    if (this._bodyListenTimer) window.clearTimeout(this._bodyListenTimer);
    this._bodyListenTimer = window.setTimeout(() => {
      document.body.addEventListener('click', this.onBodyClick);
      this._bodyListenTimer = null;
    }, 0);
  }

  /**
   * cart-notification lives in sticky header — PDP sticky ATC spinner can paint above it.
   * Move overlay + wrapper to document.body so the modal is always on top.
   */
  mountModalToBody() {
    if (!this.overlay || !this.wrapper) return;
    if (!this._portal) {
      this._portal = document.getElementById('cart-notification-portal');
      if (!this._portal) {
        this._portal = document.createElement('div');
        this._portal.id = 'cart-notification-portal';
        document.body.appendChild(this._portal);
      }
    }
    if (this.overlay.parentNode !== this._portal) this._portal.appendChild(this.overlay);
    if (this.wrapper.parentNode !== this._portal) this._portal.appendChild(this.wrapper);
  }

  close() {
    // Dismiss during ATC in-flight (optimistic or View Cart gate) — block reopen.
    if (this._optimistic || this._checkoutGateUntilAdd || this._checkoutCountdownTimer) {
      this._suppressNextOpen = true;
    }

    this._optimistic = false;
    this._lockedImageSrc = '';
    this._lockedPriceText = '';
    this.resetCheckoutCountdownButton();
    if (this._bodyListenTimer) {
      window.clearTimeout(this._bodyListenTimer);
      this._bodyListenTimer = null;
    }
    this.notification.classList.remove('active');
    if (this.wrapper) this.wrapper.classList.remove('is-open');
    if (this.overlay) {
      this.overlay.classList.remove('is-visible');
      this.overlay.hidden = true;
    }
    document.body.classList.remove('cart-notification-open');
    document.body.removeEventListener('click', this.onBodyClick);

    removeTrapFocus(this.activeElement);
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  getCheckoutButton() {
    return document.getElementById('cart-notification-button');
  }

  /**
   * Count down 5→1 then "Loading…" until /cart/add succeeds (renderContents) or fails.
   * Hitting 0 never unlocks View Cart.
   */
  startCheckoutCountdown() {
    const btn = this.getCheckoutButton();
    if (!btn) return;

    this.clearCheckoutCountdownTimer();
    this.clearCheckoutHangTimer();
    this._checkoutGateUntilAdd = true;
    if (!btn.dataset.myprintsyCheckoutLabel) {
      btn.dataset.myprintsyCheckoutLabel = (btn.textContent || 'View Cart & Checkout').replace(/\s+/g, ' ').trim();
    }
    if (!btn.dataset.myprintsyCheckoutHref) {
      btn.dataset.myprintsyCheckoutHref = btn.getAttribute('href') || '/cart';
    }

    btn.removeAttribute('href');
    btn.setAttribute('aria-disabled', 'true');
    btn.style.pointerEvents = 'none';
    btn.style.opacity = '0.75';
    btn.style.cursor = 'wait';

    let left = 5;
    const paint = () => {
      if (left > 0) {
        btn.textContent = `Loading… ${left}s`;
        left -= 1;
        this._checkoutCountdownTimer = window.setTimeout(paint, 1000);
        return;
      }
      btn.textContent = 'Loading…';
      this._checkoutCountdownTimer = null;
    };
    paint();
    this.startCartWatch();

    // ponytail: 15s hang ceiling; unlock if cart already changed, else close popup.
    this._checkoutHangTimer = window.setTimeout(() => {
      this._checkoutHangTimer = null;
      if (!this._checkoutGateUntilAdd) return;
      this.finishCheckoutGateFromCart(true);
    }, 15000);
  }

  cartFingerprint(cart) {
    return (cart.items || []).map((item) => `${item.key}:${item.quantity}`).join('|');
  }

  startCartWatch() {
    this.clearCartWatch();
    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        this._cartWatchFingerprint = this.cartFingerprint(cart);
        this.scheduleCartWatchTick();
      })
      .catch(() => this.scheduleCartWatchTick());
  }

  scheduleCartWatchTick() {
    this.clearCartWatch();
    if (!this._checkoutGateUntilAdd) return;
    this._cartWatchTimer = window.setTimeout(() => this.tickCartWatch(), 600);
  }

  tickCartWatch() {
    if (!this._checkoutGateUntilAdd) return;
    this.finishCheckoutGateFromCart(false);
  }

  /** Unlock when Customily/Hulk added without product-form renderContents. */
  finishCheckoutGateFromCart(isHang) {
    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        if (!this._checkoutGateUntilAdd) return;
        const next = this.cartFingerprint(cart);
        if (this._cartWatchFingerprint && next !== this._cartWatchFingerprint) {
          this.resetCheckoutCountdownButton();
          return;
        }
        if (!this._cartWatchFingerprint) this._cartWatchFingerprint = next;
        if (isHang) {
          this.closeOptimistic();
          if (this._checkoutGateUntilAdd) this.close();
          return;
        }
        this.scheduleCartWatchTick();
      })
      .catch(() => {
        if (!this._checkoutGateUntilAdd) return;
        if (isHang) {
          this.closeOptimistic();
          if (this._checkoutGateUntilAdd) this.close();
          return;
        }
        this.scheduleCartWatchTick();
      });
  }

  clearCartWatch() {
    if (this._cartWatchTimer) {
      window.clearTimeout(this._cartWatchTimer);
      this._cartWatchTimer = null;
    }
  }

  clearCheckoutCountdownTimer() {
    if (this._checkoutCountdownTimer) {
      window.clearTimeout(this._checkoutCountdownTimer);
      this._checkoutCountdownTimer = null;
    }
  }

  clearCheckoutHangTimer() {
    if (this._checkoutHangTimer) {
      window.clearTimeout(this._checkoutHangTimer);
      this._checkoutHangTimer = null;
    }
  }

  resetCheckoutCountdownButton() {
    this._checkoutGateUntilAdd = false;
    this.clearCheckoutCountdownTimer();
    this.clearCheckoutHangTimer();
    this.clearCartWatch();
    const btn = this.getCheckoutButton();
    if (!btn) return;
    const href = btn.dataset.myprintsyCheckoutHref || '/cart';
    const label = btn.dataset.myprintsyCheckoutLabel || 'View Cart & Checkout';
    btn.setAttribute('href', href);
    btn.textContent = label;
    btn.removeAttribute('aria-disabled');
    btn.style.pointerEvents = '';
    btn.style.opacity = '';
    btn.style.cursor = '';
  }

  resolveOptimisticImage() {
    // What you see on the gallery is the source of truth (incl. blob/canvas).
    const liveSrc = this.resolveLiveCustomilyImage();
    if (liveSrc) return liveSrc;

    // No live capture (tainted/blank canvas) — the main photo on screen beats any cached URL.
    // The pinned fallback is the pixel on screen; Customily may have swapped the theme img's src.
    const mainSrc =
      this.firstRenderedImageSrc(
        '.product__media-item.is-active .product-media-container > img.myprintsy-shopify-fallback, .product-media-container > img.myprintsy-shopify-fallback'
      ) ||
      this.firstRenderedImageSrc('.customily_gallery_slide img') ||
      this.firstRenderedImageSrc(
        '.product__media-item.is-active img, media-gallery .product__media img, .product__media img'
      );
    if (mainSrc) return mainSrc;

    const remembered =
      typeof window.__myprintsyGetValidRememberedPreviewSrc === 'function'
        ? window.__myprintsyGetValidRememberedPreviewSrc()
        : '';
    if (remembered) return remembered;

    // Nothing rendered on screen (collapsed theme gallery + tainted canvas) — any gallery photo
    // still beats an empty popup image.
    const any = document.querySelector(
      '.product-media-container > img.myprintsy-shopify-fallback, .product__media-item.is-active img, .product__media img'
    );
    return any ? any.currentSrc || any.getAttribute('src') || '' : '';
  }

  /**
   * Capture the personalized preview the shopper actually sees.
   * Desktop often uses blob:/canvas Customily layers — do NOT skip those
   * (skipping caused stale Preview-modal Pack-N HTTPS to win).
   */
  /**
   * First image of `selector` that is really on screen. On mobile Customily replaces the theme
   * gallery with its own slider, leaving the pinned fallback 0x0 and the other slides parked
   * off-screen to the left — both would otherwise win and show the wrong design.
   */
  firstRenderedImageSrc(selector) {
    const list = document.querySelectorAll(selector);
    for (let i = 0; i < list.length; i++) {
      const el = list[i];
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) continue;
      if (r.right < 1 || r.left > window.innerWidth - 1) continue;
      const src = el.currentSrc || el.getAttribute('src') || '';
      if (src) return src;
    }
    return '';
  }

  /** Does this layer's gallery slide show the pinned Shopify photo on top? */
  hasPinnedShopifyPhoto(el) {
    if (el.classList.contains('myprintsy-shopify-fallback')) return false;
    const host = el.closest('.product-media-container');
    return !!(host && host.querySelector(':scope > img.myprintsy-shopify-fallback'));
  }

  /** Is this layer the one actually painted on top at its own centre? */
  isTopmostLayer(el, rect) {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (cx < 0 || cy < 0 || cx > window.innerWidth || cy > window.innerHeight) return false;
    const hit = document.elementFromPoint(cx, cy);
    return !!hit && (hit === el || el.contains(hit) || hit.contains(el));
  }

  resolveLiveCustomilyImage() {
    const roots = [];
    const active = document.querySelector('.product__media-item.is-active');
    if (active) roots.push(active);
    document
      .querySelectorAll(
        'media-gallery .product-media-container .media, product-info .product__media-wrapper .product-media-container .media, media-gallery, .customily_gallery_media'
      )
      .forEach((node) => roots.push(node));

    let best = null;
    let bestScore = -1;

    const consider = (el) => {
      if (!el || !el.isConnected) return;
      const isCanvas = el.tagName === 'CANVAS';
      const isImg = el.tagName === 'IMG';
      if (!isCanvas && !isImg) return;

      let src = '';
      if (isImg) {
        src = String(el.currentSrc || el.getAttribute('src') || '');
        if (!src) return;
      }

      let cs;
      try {
        cs = window.getComputedStyle(el);
      } catch (_) {
        return;
      }
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (parseFloat(cs.opacity) === 0) return;

      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 40) return;

      let score = r.width * r.height;
      const cls = String(el.className || '');
      // Fabric's interaction layer is transparent — capturing it yields a blank frame.
      if (isCanvas && el.classList.contains('upper-canvas')) return;
      const isCustomilyLayer =
        isCanvas ||
        /myprintsy-customily-overlay|cl-preview|customily/i.test(cls) ||
        /^blob:|^data:/i.test(src) ||
        /customily|cl-preview|\/previews?\//i.test(src);

      // Gallery pinned to the Shopify photo (customily-preview-atc.js) — Customily's layers are
      // demoted under it and may still hold the previous Pack's render. Never capture them.
      if (isCustomilyLayer && this.hasPinnedShopifyPhoto(el)) return;

      // Canvas is what the shopper is looking at right now; an <img> whose URL merely looks
      // Customily-ish can be a leftover preview from another personalization sitting under it.
      if (isCanvas) score += 2e7;
      else if (!this.isTopmostLayer(el, r)) return;
      else if (isCustomilyLayer) score += 1e7;
      if (/cdn\.shopify\.com|shopify\.com\/s\/files/i.test(src)) score -= 5e6;
      if (el.classList.contains('myprintsy-base-product-img') || el.classList.contains('myprintsy-shopify-fallback')) {
        score -= 2e6;
      }

      if (score > bestScore) {
        bestScore = score;
        best = { el, src, isCanvas, isCustomilyLayer };
      }
    };

    roots.forEach((root) => {
      if (!root) return;
      root.querySelectorAll('img, canvas').forEach(consider);
    });

    if (!best || !best.isCustomilyLayer) return '';

    if (best.isCanvas) {
      let data = '';
      try {
        data = best.el.toDataURL('image/jpeg', 0.9);
      } catch (_) {
        return ''; // tainted canvas
      }
      // ponytail: length heuristic for a blank/half-mounted canvas (a real mug render is ~100KB+,
      // an empty one a couple of KB). Upgrade path: sample pixels via getImageData.
      return data.length > 20000 ? data : '';
    }

    return best.src;
  }

  resolveOptimisticTitle() {
    const el = document.querySelector(
      'product-info h1.product__title, product-info .product__title, .product__info-container h1.product__title, h1.product__title'
    );
    if (!el) return 'Item';

    const clone = el.cloneNode(true);
    clone
      .querySelectorAll('.visually-hidden, [hidden], script, style, noscript')
      .forEach((node) => node.remove());

    let title = String(clone.textContent || '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title) {
      title = String(el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (title.length >= 8) {
      const mid = Math.floor(title.length / 2);
      const a = title.slice(0, mid).trim();
      const b = title.slice(mid).trim();
      if (a && a === b) title = a;
    }

    return title || 'Item';
  }

  resolveOptimisticPrice() {
    const root = document.querySelector('product-info') || document;
    const priceRoot =
      root.querySelector('[id^="price-"]') ||
      root.querySelector('.product__info-container .price') ||
      root.querySelector('.price');
    if (!priceRoot) return '';

    // Prefer the visible sale/regular amount shoppers see (skip compare-at <s>).
    const nodes = priceRoot.querySelectorAll('.price-item--sale, .price-item--regular, .price-item');
    for (let i = 0; i < nodes.length; i++) {
      const el = nodes[i];
      if (!el || el.closest('s') || el.tagName === 'S') continue;
      if (el.closest('small.unit-price')) continue;
      if (el.classList.contains('visually-hidden')) continue;
      try {
        const cs = window.getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const wrap = el.closest('.price__regular, .price__sale');
        if (wrap) {
          const wcs = window.getComputedStyle(wrap);
          if (wcs.display === 'none' || wcs.visibility === 'hidden') continue;
        }
      } catch (_) {}
      const text = String(el.textContent || '')
        .replace(/\s+/g, ' ')
        .trim();
      if (text && /[\d]/.test(text)) return text;
    }
    return '';
  }

  resolveOptimisticQty() {
    const input = document.querySelector(
      'product-info quantity-input input[name="quantity"], product-info input[name="quantity"], .product-form__quantity input[name="quantity"]'
    );
    const n = input && input.value ? String(input.value).trim() : '1';
    return n || '1';
  }

  /** Dawn swatch legend is "Color: Yellow" — don't also append value → "Color: Yellow: Yellow". */
  normalizeOptionMeta(label, value) {
    let name = String(label || '')
      .replace(/\s+/g, ' ')
      .trim();
    let val = String(value || '')
      .replace(/\s+/g, ' ')
      .trim();

    const legendSplit = name.match(/^([^:]+):\s*(.*)$/);
    if (legendSplit) {
      name = legendSplit[1].trim();
      const legendVal = legendSplit[2].trim();
      if (!val) val = legendVal;
    }

    const namePrefix = name + ':';
    if (val.toLowerCase().startsWith(namePrefix.toLowerCase())) {
      val = val.slice(namePrefix.length).trim();
    }

    // "Yellow: Yellow"
    const dup = val.match(/^(.+?):\s*\1$/i);
    if (dup) val = dup[1].trim();

    return { label: name, value: val };
  }

  /** Pack / Size / Color etc. from currently selected PDP options (incl. Buy More Save More). */
  resolveOptimisticOptionMetas() {
    const metas = [];
    const root = document.querySelector('product-info') || document;

    root.querySelectorAll('fieldset').forEach((fs) => {
      if (!fs.closest('product-info, .product__info-container, variant-radios, variant-selects')) return;
      const legend = fs.querySelector('legend');
      const rawLabel = legend ? String(legend.textContent || '').replace(/\s+/g, ' ').trim() : '';
      if (!rawLabel) return;
      const checked = fs.querySelector('input:checked');
      if (!checked) return;
      let value = checked.value || '';
      const lab = checked.labels && checked.labels[0];
      if (lab) {
        const clone = lab.cloneNode(true);
        clone.querySelectorAll('.visually-hidden, [hidden]').forEach((n) => n.remove());
        const t = String(clone.textContent || '').replace(/\s+/g, ' ').trim();
        if (t) value = t;
      }
      const normalized = this.normalizeOptionMeta(rawLabel, value);
      if (!normalized.label || !normalized.value) return;
      if (metas.some((m) => m.label === normalized.label)) return;
      metas.push(normalized);
    });

    root.querySelectorAll('select').forEach((sel) => {
      if (!sel.closest('product-info, .product__info-container, variant-selects')) return;
      const name = String(sel.getAttribute('name') || sel.getAttribute('data-option') || '')
        .replace(/^options\[|\]$/g, '')
        .trim();
      const opt = sel.options[sel.selectedIndex];
      const value = opt ? String(opt.textContent || opt.value || '').replace(/\s+/g, ' ').trim() : '';
      if (!name || !value || /quantity|id/i.test(name)) return;
      const normalized = this.normalizeOptionMeta(name, value);
      if (metas.some((m) => m.label === normalized.label)) return;
      metas.push(normalized);
    });

    return metas;
  }

  buildOptimisticMetaHtml() {
    const parts = [];
    this.resolveOptimisticOptionMetas().forEach((m) => {
      parts.push(
        `<p class="cart-notification-product__meta">${this.escapeHtml(m.label)}: ${this.escapeHtml(m.value)}</p>`
      );
    });
    parts.push(
      `<p class="cart-notification-product__meta" data-myprintsy-qty>Quantity: ${this.escapeHtml(
        this.resolveOptimisticQty()
      )}</p>`
    );
    return parts.join('');
  }

  /**
   * Show cart-notification immediately on ATC click.
   * Price resolves first (before image capture); qty/pack from PDP.
   * @param {{ fromUserGesture?: boolean }} opts
   *   fromUserGesture: clear dismiss-suppress (early click only).
   *   Late Customily/product-form calls must omit this so X stays closed.
   */
  openOptimistic(opts = {}) {
    if (opts.fromUserGesture) {
      this._suppressNextOpen = false;
    } else if (this._suppressNextOpen) {
      return;
    }

    const root = document.getElementById('cart-notification-product');
    if (!root) return;

    if (this._optimistic && root.querySelector('[data-myprintsy-optimistic]')) {
      return;
    }

    // Popup still open on the PREVIOUS cycle's finished line item (dismissing while /cart/add was
    // in flight lets Customily's own ATC click reopen it) — repaint it, or the shopper keeps
    // staring at the old name until the next /cart/add answers seconds later.
    const staleCycle = this.notification.classList.contains('active') && !this._optimistic;
    if (staleCycle) this._lockedImageSrc = '';

    // Price + text first (cheap) — before slow gallery image capture.
    const title = this.escapeHtml(opts.title || this.resolveOptimisticTitle());
    const priceRaw = opts.price || this.resolveOptimisticPrice();
    if (priceRaw) this._lockedPriceText = String(priceRaw).replace(/\s+/g, ' ').trim();
    const price = this.escapeHtml(this._lockedPriceText);
    const metaHtml = this.buildOptimisticMetaHtml();
    const img = opts.imageSrc || this.resolveOptimisticImage();
    if (img) this._lockedImageSrc = img;

    const imgHtml = this._lockedImageSrc
      ? `<div class="cart-notification-product__image"><img src="${this.escapeHtml(
          this._lockedImageSrc
        )}" alt="${title}" width="260" height="260" loading="eager" fetchpriority="high" decoding="async"></div>`
      : '';

    this._optimistic = true;
    root.innerHTML =
      `<div class="cart-item cart-notification-product__row" data-myprintsy-optimistic="1">` +
      imgHtml +
      `<div class="cart-notification-product__details">` +
      `<h3 class="cart-notification-product__name">${title}</h3>` +
      metaHtml +
      (price
        ? `<p class="cart-notification-product__price">${price}</p>`
        : `<p class="cart-notification-product__meta">Adding to cart…</p>`) +
      `</div></div>`;

    if (this.header) this.header.reveal();
    this.open();
    this.startCheckoutCountdown();
  }

  closeOptimistic() {
    if (!this._optimistic) return;
    this.close();
    const root = document.getElementById('cart-notification-product');
    if (root && root.querySelector('[data-myprintsy-optimistic]')) root.innerHTML = '';
  }

  /**
   * After cart returns: update option/qty/price text.
   * Image: optimistic capture shows instantly, then upgrade once to the server Customily
   * preview of the added line item after preload (no flicker, fixes a wrong capture).
   */
  syncDetailsTextOnly(el, html) {
    if (!el || !html) return false;
    const curImg = el.querySelector('.cart-notification-product__image img');
    if (!curImg) return false;

    const parsed = new DOMParser().parseFromString(`<div id="__wrap">${html}</div>`, 'text/html');
    const nextDetails = parsed.querySelector('.cart-notification-product__details');
    const curDetails = el.querySelector('.cart-notification-product__details');
    if (!nextDetails || !curDetails) return false;

    const keepName = curDetails.querySelector('.cart-notification-product__name');
    const nextName = nextDetails.querySelector('.cart-notification-product__name');
    if (keepName && nextName) {
      const nextTitle = String(nextName.textContent || '').replace(/\s+/g, ' ').trim();
      if (nextTitle && keepName.textContent.trim() !== nextTitle) {
        keepName.textContent = nextTitle;
      }
    }

    curDetails
      .querySelectorAll(
        '.cart-notification-product__meta, .cart-notification-product__price, .hulkapps-reminder, button.edit_cart_option, span[data-hulkapps-line-properties], .product-option'
      )
      .forEach((node) => node.remove());

    nextDetails.querySelectorAll(':scope > *').forEach((node) => {
      if (node.classList && node.classList.contains('cart-notification-product__name')) return;
      // Keep PDP price — cart item.final_price often includes extra cart discounts (e.g. 52.95→42.36).
      if (node.classList && node.classList.contains('cart-notification-product__price')) {
        if (this._lockedPriceText) {
          const keep = document.createElement('p');
          keep.className = 'cart-notification-product__price';
          keep.textContent = this._lockedPriceText;
          curDetails.appendChild(keep);
          return;
        }
      }
      curDetails.appendChild(document.importNode(node, true));
    });

    const nextImg = parsed.querySelector('.cart-notification-product__image img, img');
    const nextSrc = nextImg ? String(nextImg.getAttribute('src') || '') : '';
    const curSrc = String(curImg.getAttribute('src') || '');
    const serverIsCustomily = /customily|cl-preview|\/previews?\//i.test(nextSrc);
    // Server _customily-preview belongs to the line item just added — it outranks our
    // optimistic canvas grab, which can freeze a half-rendered frame (wrong design).
    if (serverIsCustomily && nextSrc && nextSrc !== curSrc) {
      const warm = new Image();
      warm.onload = () => {
        if (!curImg.isConnected) return;
        curImg.setAttribute('src', nextSrc);
        this._lockedImageSrc = nextSrc;
      };
      warm.src = nextSrc;
    }

    const row = el.querySelector('[data-myprintsy-optimistic]');
    if (row) row.removeAttribute('data-myprintsy-optimistic');
    return true;
  }

  /** Preview URL attached to the line Customily just added (property or featured_image). */
  resolveLineItemPreviewSrc(line) {
    if (!line) return '';
    const props = line.properties || {};
    for (const key of Object.keys(props)) {
      const val = String(props[key] || '');
      if (/customily|cl-preview|\/previews?\//i.test(key + val) && /^https?:\/\//i.test(val)) {
        return val;
      }
    }
    const featured = line.featured_image;
    if (featured && typeof featured === 'object' && featured.url) return String(featured.url);
    if (typeof featured === 'string') return featured;
    if (line.image) return String(line.image);
    return '';
  }

  upgradeOptimisticImage(src) {
    if (!src || !/customily|cl-preview|\/previews?\//i.test(src)) return;
    const curImg = document.querySelector(
      '#cart-notification-product .cart-notification-product__image img'
    );
    if (!curImg) return;
    const curSrc = String(curImg.getAttribute('src') || '');
    if (src === curSrc) return;
    const warm = new Image();
    warm.onload = () => {
      if (!curImg.isConnected) return;
      curImg.setAttribute('src', src);
      this._lockedImageSrc = src;
    };
    warm.src = src;
  }

  /** Keep the header cart badge in sync without a sections payload on /cart/add. */
  refreshCartIconBubble(itemCount) {
    const host = document.getElementById('cart-icon-bubble');
    if (!host || itemCount == null || !Number.isFinite(Number(itemCount))) return;
    const count = Math.max(0, Number(itemCount));

    let bubble = host.querySelector('.cart-count-bubble');
    if (count <= 0) {
      if (bubble) bubble.remove();
      return;
    }

    if (!bubble) {
      bubble = document.createElement('div');
      bubble.className = 'cart-count-bubble';
      host.appendChild(bubble);
    }

    let visible = bubble.querySelector('span[aria-hidden="true"]');
    if (count < 100) {
      if (!visible) {
        visible = document.createElement('span');
        visible.setAttribute('aria-hidden', 'true');
        bubble.insertBefore(visible, bubble.firstChild);
      }
      visible.textContent = String(count);
    } else if (visible) {
      visible.remove();
    }

    let sr = bubble.querySelector('.visually-hidden');
    if (!sr) {
      sr = document.createElement('span');
      sr.className = 'visually-hidden';
      bubble.appendChild(sr);
    }
    sr.textContent = `${count} items`;
  }

  refreshCartIconBubbleFromCart() {
    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => this.refreshCartIconBubble(cart.item_count))
      .catch(() => {});
  }

  /**
   * /cart/add without sections: keep the optimistic row, unlock View Cart, upgrade preview
   * from the line JSON, refresh the cart badge via /cart.js.
   */
  finalizeFromLineItem(line) {
    const root = document.getElementById('cart-notification-product');
    if (root) {
      const row = root.querySelector('[data-myprintsy-optimistic]');
      if (row) row.removeAttribute('data-myprintsy-optimistic');
    }
    this.upgradeOptimisticImage(this.resolveLineItemPreviewSrc(line));
    this.refreshCartIconBubbleFromCart();
  }

  renderContents(parsedState) {
    const suppressOpen = this._suppressNextOpen;
    this._suppressNextOpen = false;
    this._optimistic = false;
    this.resetCheckoutCountdownButton();
    this.cartItemKey = parsedState.key;
    const alreadyOpen = this.notification.classList.contains('active');

    if (!this._lockedImageSrc) {
      this._lockedImageSrc = this.resolveOptimisticImage() || '';
    }

    if (!parsedState.sections) {
      this.finalizeFromLineItem(parsedState);
    } else {
      this.getSectionsToRender().forEach((section) => {
        const el = document.getElementById(section.id);
        if (!el || !parsedState.sections[section.id]) return;
        const html = this.getSectionInnerHTML(parsedState.sections[section.id], section.selector);
        if (html == null) return;

        if (section.id === 'cart-notification-product') {
          if (this.syncDetailsTextOnly(el, html)) return;

          // First paint: prefer server Customily URL over any stale lock.
          const serverSrcMatch = html.match(/<img\b[^>]*?\bsrc="([^"]+)"/i);
          const serverSrc = serverSrcMatch ? serverSrcMatch[1] : '';
          if (serverSrc && /customily|cl-preview|\/previews?\//i.test(serverSrc)) {
            this._lockedImageSrc = serverSrc;
            el.innerHTML = html;
            return;
          }

          let safeHtml = html;
          if (this._lockedImageSrc && !/^blob:|^data:/i.test(this._lockedImageSrc)) {
            const safe = this.escapeHtml(this._lockedImageSrc);
            safeHtml = html.replace(/(<img\b[^>]*?\bsrc=")([^"]*)(")/gi, `$1${safe}$3`);
          }
          el.innerHTML = safeHtml;
          return;
        }

        el.innerHTML = html;
      });
    }

    // Do NOT touch img.src here — any setAttribute causes a visible flash.

    if (suppressOpen) return;

    if (this.header) this.header.reveal();
    if (alreadyOpen) return;
    this.open();
  }

  getSectionsToRender() {
    return [
      {
        id: 'cart-notification-product',
        selector: `[id="cart-notification-product-${this.cartItemKey}"]`,
      },
      {
        id: 'cart-notification-button',
      },
      {
        id: 'cart-icon-bubble',
      },
    ];
  }

  getSectionInnerHTML(html, selector = '.shopify-section') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const root = doc.querySelector(selector) || doc.querySelector('.shopify-section') || doc.body;
    return root ? root.innerHTML : '';
  }

  handleBodyClick(evt) {
    if (Date.now() < this._ignoreBodyClickUntil) return;

    const target = evt.target;
    if (
      target.closest(
        '#customily-cart-btn, .myprintsy-customily-preview-atc, product-form [type="submit"], product-form button[name="add"], button.add_to_cart'
      )
    ) {
      return;
    }
    if (target.closest('#cart-notification') || target.closest('[data-cart-notification-overlay]')) {
      return;
    }
    if (target !== this.notification && !target.closest('cart-notification')) {
      const disclosure = target.closest('details-disclosure, header-menu');
      this.activeElement = disclosure ? disclosure.querySelector('summary') : null;
      this.close();
    }
  }

  setActiveElement(element) {
    this.activeElement = element;
  }
}

customElements.define('cart-notification', CartNotification);
