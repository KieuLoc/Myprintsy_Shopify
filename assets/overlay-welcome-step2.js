if (!customElements.get('welcome-step2-popup')) {
  class WelcomeStep2Popup extends HTMLElement {
    static instances = new Set();
    static TEASER_DISMISS_KEY = 'welcome-teaser-dismissed';
    /** Session flag: Welcome/Step2 was closed → teaser must survive full page navigations. */
    static TEASER_ACTIVE_KEY = 'welcome-teaser-active';

    constructor() {
      super();
      this.modal = this.querySelector('.success-opt-in-popup');
      this.overlay = this.querySelector('.success-opt-in-popup__overlay');
      this.closeButton = this.querySelector('.success-opt-in-popup__close');
      this.ctaButton = this.querySelector('[data-success-opt-in-cta]');
      this.dismissButton = this.querySelector('[data-success-opt-in-dismiss]');
      this.copyButton = this.querySelector('[data-success-opt-in-copy]');
      this.teaser = this.querySelector('[data-welcome-teaser]');
      this.teaserOpenButton = this.querySelector('[data-welcome-teaser-open]');
      this.teaserDismissButton = this.querySelector('[data-welcome-teaser-dismiss]');
      this.copyResetTimer = null;
      this.countdownTimer = null;
      this.pendingDestination = (this.dataset.defaultLink || '/checkout').trim() || '/checkout';
      this.boundHandlers = {};
    }

    connectedCallback() {
      if (!this.modal) {
        this.modal = this.querySelector('.success-opt-in-popup');
      }
      if (!this.modal) return;

      // Parser/innerHTML can run the constructor before children exist — re-bind teaser nodes.
      this.teaser = this.querySelector('[data-welcome-teaser]');
      this.teaserOpenButton = this.querySelector('[data-welcome-teaser-open]');
      this.teaserDismissButton = this.querySelector('[data-welcome-teaser-dismiss]');

      this.sectionId = this.dataset.sectionId || this.closest('.shopify-section')?.id?.replace('shopify-section-', '') || '';
      WelcomeStep2Popup.instances.add(this);
      this.bindModalEvents();
      this.bindTeaserEvents();

      // Teaser is only painted on close() in the same document. Full navigations rebuild the DOM
      // with the teaser hidden again — restore from the session flag set by showActiveTeaser().
      if (WelcomeStep2Popup.shouldRestoreTeaser()) {
        queueMicrotask(() => WelcomeStep2Popup.showActiveTeaser());
      }

      if (window.Shopify?.designMode) {
        this.bindDesignModeEvents();
        if (this.modal.classList.contains('is-open')) {
          this.armDeferredMedia();
          this.startCountdown();
        }
      }
    }

    disconnectedCallback() {
      WelcomeStep2Popup.instances.delete(this);
      this.unbindDesignModeEvents();
      this.stopCountdown();
    }

    matchesDeviceTarget() {
      const target = this.dataset.deviceTarget || 'desktop';
      const isMobile = window.matchMedia('(max-width: 749px)').matches;

      if (target === 'mobile') return isMobile;
      return !isMobile;
    }

    static isTeaserDismissed() {
      try {
        return sessionStorage.getItem(WelcomeStep2Popup.TEASER_DISMISS_KEY) === '1';
      } catch (_) {
        return false;
      }
    }

    static shouldRestoreTeaser() {
      if (window.Shopify?.designMode) return false;
      if (WelcomeStep2Popup.isTeaserDismissed()) return false;
      if (customElements.get('cart-reminder-popup')?.isWelcomeProductCodeExcluded?.()) return false;
      try {
        return sessionStorage.getItem(WelcomeStep2Popup.TEASER_ACTIVE_KEY) === '1';
      } catch (_) {
        return false;
      }
    }

    static hideActiveTeaser() {
      WelcomeStep2Popup.instances.forEach((instance) => instance.hideTeaser());
    }

    static showActiveTeaser() {
      if (window.Shopify?.designMode) return;
      if (WelcomeStep2Popup.isTeaserDismissed()) return;
      if (customElements.get('cart-reminder-popup')?.isWelcomeProductCodeExcluded?.()) return;

      try {
        sessionStorage.setItem(WelcomeStep2Popup.TEASER_ACTIVE_KEY, '1');
      } catch (_) {}

      const instance = [...WelcomeStep2Popup.instances].find(
        (candidate) => candidate.matchesDeviceTarget() && candidate.teaser
      );

      if (instance) {
        instance.showTeaser();
      }
    }

    showTeaser() {
      if (!this.teaser || !this.matchesDeviceTarget()) return;
      if (WelcomeStep2Popup.isTeaserDismissed()) return;

      WelcomeStep2Popup.instances.forEach((instance) => {
        if (instance !== this) instance.hideTeaser();
      });

      this.teaser.hidden = false;
      this.teaser.setAttribute('aria-hidden', 'false');
      this.teaser.classList.add('is-visible');
    }

    hideTeaser() {
      if (!this.teaser) return;

      this.teaser.hidden = true;
      this.teaser.setAttribute('aria-hidden', 'true');
      this.teaser.classList.remove('is-visible');
    }

    dismissTeaser() {
      try {
        sessionStorage.setItem(WelcomeStep2Popup.TEASER_DISMISS_KEY, '1');
        sessionStorage.removeItem(WelcomeStep2Popup.TEASER_ACTIVE_KEY);
      } catch (_) {}
      WelcomeStep2Popup.hideActiveTeaser();
    }

    bindTeaserEvents() {
      if (!this.teaser) return;

      this.boundHandlers.teaserOpen = () => this.handleTeaserOpen();
      this.boundHandlers.teaserDismiss = (event) => {
        event.preventDefault();
        event.stopPropagation();
        this.dismissTeaser();
      };

      this.teaserOpenButton?.addEventListener('click', this.boundHandlers.teaserOpen);
      this.teaserDismissButton?.addEventListener('click', this.boundHandlers.teaserDismiss);
    }

    handleTeaserOpen() {
      this.hideTeaser();

      const target = this.dataset.deviceTarget || 'desktop';
      const welcome = document.querySelector(
        `cart-reminder-popup[data-storage-key="welcome-popup"][data-device-target="${target}"]`
      );

      if (welcome && typeof welcome.openFromTeaser === 'function') {
        welcome.openFromTeaser();
        return;
      }

      const CartReminderPopup = customElements.get('cart-reminder-popup');
      CartReminderPopup?.openWelcomeFromTeaser?.();
    }

    static open(options = {}) {
      const isMobile = window.matchMedia('(max-width: 749px)').matches;
      const target = isMobile ? 'mobile' : 'desktop';
      const instances = [...WelcomeStep2Popup.instances];
      const instance =
        instances.find((popup) => popup.dataset.deviceTarget === target) || instances[0];

      if (!instance) return false;

      instance.open(options);
      return true;
    }

    bindDesignModeEvents() {
      this.boundHandlers.sectionSelect = (event) => {
        WelcomeStep2Popup.syncDesignModeSelection(event.detail.sectionId);
      };

      document.addEventListener('shopify:section:select', this.boundHandlers.sectionSelect);
      document.addEventListener('shopify:section:deselect', this.boundHandlers.sectionSelect);
      document.addEventListener('shopify:section:load', this.boundHandlers.sectionSelect);

      WelcomeStep2Popup.syncDesignModeSelection(WelcomeStep2Popup.getSelectedSectionId());
    }

    static getSelectedSectionId() {
      const fromUrl = new URLSearchParams(window.location.search).get('section');
      if (fromUrl) return fromUrl;

      const selectedSection = document.querySelector(
        '.shopify-section.shopify-section-group-overlay-group.shopify-section--selected'
      );

      return selectedSection?.id?.replace('shopify-section-', '') || null;
    }

    static syncDesignModeSelection(selectedSectionId) {
      if (!window.Shopify?.designMode) return;

      const activeSectionId = selectedSectionId || WelcomeStep2Popup.getSelectedSectionId();

      WelcomeStep2Popup.instances.forEach((instance) => {
        if (activeSectionId && instance.sectionId === activeSectionId) {
          instance.open({ preview: true });
          return;
        }

        instance.close({ skipTeaser: true });
      });
    }

    unbindDesignModeEvents() {
      document.removeEventListener('shopify:section:select', this.boundHandlers.sectionSelect);
      document.removeEventListener('shopify:section:deselect', this.boundHandlers.sectionSelect);
      document.removeEventListener('shopify:section:load', this.boundHandlers.sectionSelect);
    }

    bindModalEvents() {
      this.boundHandlers.closeClick = () => this.close();
      this.boundHandlers.ctaClick = () => this.handleCtaClick();
      this.boundHandlers.dismissClick = () => this.close();
      this.boundHandlers.copyClick = () => this.handleCopyClick();

      this.closeButton?.addEventListener('click', this.boundHandlers.closeClick);
      this.overlay?.addEventListener('click', this.boundHandlers.closeClick);
      this.ctaButton?.addEventListener('click', this.boundHandlers.ctaClick);
      this.dismissButton?.addEventListener('click', this.boundHandlers.dismissClick);
      this.copyButton?.addEventListener('click', this.boundHandlers.copyClick);
      this.modal.addEventListener('keyup', (event) => {
        if (event.code.toUpperCase() === 'ESCAPE') this.close();
      });
    }

    getPromoCode() {
      const fromDataset = (this.dataset.promoCode || '').trim();
      if (fromDataset) return fromDataset;

      return (this.copyButton?.dataset.copyCode || '').trim();
    }

    buildCtaDestination() {
      const destination =
        this.pendingDestination || (this.dataset.defaultLink || '/checkout').trim() || '/checkout';
      const promoCode = this.getPromoCode();
      if (!promoCode) return destination;

      let checkoutPath = destination;

      try {
        checkoutPath = new URL(destination, window.location.origin).pathname;
      } catch (error) {
        checkoutPath = destination.split('?')[0];
      }

      const isCheckoutTarget =
        checkoutPath === '/checkout' ||
        checkoutPath.endsWith('/checkout') ||
        destination.includes('/checkout');

      if (!isCheckoutTarget) return destination;

      const redirect = checkoutPath.startsWith('/') ? checkoutPath : '/checkout';
      return `/discount/${encodeURIComponent(promoCode)}?redirect=${encodeURIComponent(redirect)}`;
    }

    handleCtaClick() {
      const destination = this.buildCtaDestination();
      this.close({ skipTeaser: true });
      window.location.assign(destination);
    }

    async handleCopyClick() {
      const button = this.copyButton;
      if (!button) return;

      const code = (button.dataset.copyCode || '').trim();
      if (!code) return;

      const copied = await this.copyTextToClipboard(code);
      if (!copied) return;

      button.classList.add('is-copied');
      const originalLabel = button.getAttribute('aria-label') || 'Copy promo code';
      button.setAttribute('aria-label', `Copied ${code}`);

      window.clearTimeout(this.copyResetTimer);
      this.copyResetTimer = window.setTimeout(() => {
        button.classList.remove('is-copied');
        button.setAttribute('aria-label', originalLabel);
      }, 1800);
    }

    async copyTextToClipboard(text) {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          return true;
        }
      } catch (error) {
        /* fall through */
      }

      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      let copied = false;

      try {
        copied = document.execCommand('copy');
      } catch (error) {
        copied = false;
      }

      textarea.remove();
      return copied;
    }

    /** Load overlay hero/bg only when popup opens. */
    armDeferredMedia() {
      this.querySelectorAll('img[data-myprintsy-defer-src]').forEach((img) => {
        if (img.dataset.myprintsyDeferArmed === '1') return;
        const src = img.dataset.myprintsyDeferSrc;
        if (src) img.src = src;
        if (img.dataset.myprintsyDeferSrcset) img.srcset = img.dataset.myprintsyDeferSrcset;
        if (img.dataset.myprintsyDeferSizes) img.sizes = img.dataset.myprintsyDeferSizes;
        img.dataset.myprintsyDeferArmed = '1';
      });

      this.querySelectorAll('[data-myprintsy-defer-bg]').forEach((el) => {
        if (el.dataset.myprintsyDeferBgArmed === '1') return;
        const url = el.dataset.myprintsyDeferBg;
        if (url) el.style.backgroundImage = `url("${url}")`;
        el.dataset.myprintsyDeferBgArmed = '1';
      });
    }

    /** HH:MM:SS from remaining ms (floor, never negative). */
    static formatCountdown(ms) {
      const totalSeconds = Math.max(0, Math.floor(Number(ms) / 1000));
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      return (
        String(hours).padStart(2, '0') +
        ':' +
        String(minutes).padStart(2, '0') +
        ':' +
        String(seconds).padStart(2, '0')
      );
    }

    countdownStorageKey() {
      const code = (this.dataset.promoCode || 'default').trim().toLowerCase() || 'default';
      return `welcome-step2-expires-at:${code}`;
    }

    getCountdownHours() {
      const hours = Number(this.dataset.countdownHours ?? 2);
      if (!Number.isFinite(hours) || hours <= 0) return 2;
      return hours;
    }

    getOrCreateExpiryAt() {
      const key = this.countdownStorageKey();
      const durationMs = this.getCountdownHours() * 60 * 60 * 1000;

      if (window.Shopify?.designMode) {
        return Date.now() + durationMs;
      }

      try {
        const stored = Number(localStorage.getItem(key));
        if (stored && !Number.isNaN(stored) && stored > Date.now()) {
          return stored;
        }
        const next = Date.now() + durationMs;
        localStorage.setItem(key, String(next));
        return next;
      } catch (error) {
        return Date.now() + durationMs;
      }
    }

    paintCountdown() {
      const el = this.querySelector('[data-welcome-step2-countdown]');
      if (!el) return false;

      const remaining = Math.max(0, this._countdownExpiresAt - Date.now());
      el.textContent = WelcomeStep2Popup.formatCountdown(remaining);
      return remaining > 0;
    }

    startCountdown() {
      this.stopCountdown();
      this._countdownExpiresAt = this.getOrCreateExpiryAt();

      const tick = () => {
        if (!this.paintCountdown()) {
          this.stopCountdown();
        }
      };

      tick();
      this.countdownTimer = window.setInterval(tick, 1000);
    }

    stopCountdown() {
      if (this.countdownTimer) {
        window.clearInterval(this.countdownTimer);
        this.countdownTimer = null;
      }
    }

    open(options = {}) {
      if (this.modal.classList.contains('is-open')) return;

      if (options.destination) {
        this.pendingDestination = String(options.destination).trim() || this.pendingDestination;
      }

      WelcomeStep2Popup.hideActiveTeaser();
      this.armDeferredMedia();
      this.startCountdown();

      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');

      const dialog = this.modal.querySelector('[role="dialog"]');
      if (typeof trapFocus === 'function' && dialog) trapFocus(dialog);
    }

    close(options = {}) {
      if (!this.modal.classList.contains('is-open')) return;

      this.stopCountdown();
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');

      if (typeof removeTrapFocus === 'function') removeTrapFocus(this.closeButton);

      if (!options.skipTeaser && !options.preview) {
        WelcomeStep2Popup.showActiveTeaser();
      }
    }
  }

  customElements.define('welcome-step2-popup', WelcomeStep2Popup);
  window.WelcomeStep2Popup = WelcomeStep2Popup;

  // ponytail: self-check formatCountdown — fails loudly if HH:MM:SS math breaks
  (function welcomeStep2CountdownSelfCheck() {
    const cases = [
      [7200000, '02:00:00'],
      [3661000, '01:01:01'],
      [0, '00:00:00'],
      [-1000, '00:00:00'],
    ];
    for (const [ms, expected] of cases) {
      const got = WelcomeStep2Popup.formatCountdown(ms);
      if (got !== expected) {
        console.error('[welcome-step2] countdown self-check failed', { ms, expected, got });
      }
    }
  })();
}
