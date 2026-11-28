if (!customElements.get('success-opt-in-popup')) {
  class SuccessOptInPopup extends HTMLElement {
    static instances = new Set();

    constructor() {
      super();
      this.modal = this.querySelector('.success-opt-in-popup');
      this.overlay = this.querySelector('.success-opt-in-popup__overlay');
      this.closeButton = this.querySelector('.success-opt-in-popup__close');
      this.ctaButton = this.querySelector('[data-success-opt-in-cta]');
      this.dismissButton = this.querySelector('[data-success-opt-in-dismiss]');
      this.copyButton = this.querySelector('[data-success-opt-in-copy]');
      this.copyResetTimer = null;
      this.countdownTimer = null;
      this._countdownExpiresAt = 0;
      this.pendingDestination = (this.dataset.defaultLink || '/checkout').trim() || '/checkout';
      this.boundHandlers = {};
    }

    connectedCallback() {
      if (!this.modal) return;

      this.sectionId = this.dataset.sectionId || this.closest('.shopify-section')?.id?.replace('shopify-section-', '') || '';
      SuccessOptInPopup.instances.add(this);
      this.bindModalEvents();

      if (window.Shopify?.designMode) {
        this.bindDesignModeEvents();
      }
    }

    disconnectedCallback() {
      SuccessOptInPopup.instances.delete(this);
      this.unbindDesignModeEvents();
      this.stopCountdown();
    }

    static formatCountdownParts(ms) {
      const totalSeconds = Math.max(0, Math.floor(Number(ms) / 1000));
      return {
        h: String(Math.floor(totalSeconds / 3600)).padStart(2, '0'),
        m: String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0'),
        s: String(totalSeconds % 60).padStart(2, '0'),
      };
    }

    getCountdownDurationMs() {
      const minutes = Number(this.dataset.countdownMinutes);
      if (Number.isFinite(minutes) && minutes > 0) return minutes * 60 * 1000;
      return 5 * 60 * 1000;
    }

    paintCountdown() {
      const root = this.querySelector('[data-success-opt-in-countdown]');
      if (!root) return false;

      const remaining = Math.max(0, this._countdownExpiresAt - Date.now());
      const parts = SuccessOptInPopup.formatCountdownParts(remaining);
      const h = root.querySelector('[data-cd-h]');
      const m = root.querySelector('[data-cd-m]');
      const s = root.querySelector('[data-cd-s]');
      if (h) h.textContent = parts.h;
      if (m) m.textContent = parts.m;
      if (s) s.textContent = parts.s;
      return remaining > 0;
    }

    startCountdown() {
      if (!this.querySelector('[data-success-opt-in-countdown]')) return;
      this.stopCountdown();
      this._countdownExpiresAt = Date.now() + this.getCountdownDurationMs();
      const tick = () => {
        if (!this.paintCountdown()) this.stopCountdown();
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

    static open(options = {}) {
      const isMobile = window.matchMedia('(max-width: 749px)').matches;
      const target = isMobile ? 'mobile' : 'desktop';
      const variant = String(options.variant || '1');
      const instances = [...SuccessOptInPopup.instances];
      const byVariant = (v) =>
        instances.find(
          (popup) => popup.dataset.deviceTarget === target && (popup.dataset.variant || '1') === v
        );
      // v2 preferred for reminder 2; fall back to v1 while Success opt-in 2 is disabled
      const instance =
        byVariant(variant) ||
        (variant === '2' ? byVariant('1') : null) ||
        (variant === '1'
          ? instances.find((popup) => popup.dataset.deviceTarget === target) || instances[0]
          : null);

      if (!instance) return false;

      instance.open(options);
      return true;
    }

    bindDesignModeEvents() {
      this.boundHandlers.sectionSelect = (event) => {
        SuccessOptInPopup.syncDesignModeSelection(event.detail.sectionId);
      };

      document.addEventListener('shopify:section:select', this.boundHandlers.sectionSelect);
      document.addEventListener('shopify:section:deselect', this.boundHandlers.sectionSelect);
      document.addEventListener('shopify:section:load', this.boundHandlers.sectionSelect);

      SuccessOptInPopup.syncDesignModeSelection(SuccessOptInPopup.getSelectedSectionId());
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

      const activeSectionId = selectedSectionId || SuccessOptInPopup.getSelectedSectionId();

      SuccessOptInPopup.instances.forEach((instance) => {
        if (activeSectionId && instance.sectionId === activeSectionId) {
          instance.open({ preview: true });
          return;
        }

        instance.close();
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

    applyPromoCode(code) {
      const next = String(code || '').trim();
      if (!next) return;

      this.dataset.promoCode = next;

      const prefix = this.querySelector('.success-opt-in-popup__heading-prefix');
      const highlight = this.querySelector('.success-opt-in-popup__heading-highlight');
      const suffix = this.querySelector('.success-opt-in-popup__heading-suffix');
      if (prefix) prefix.textContent = next;
      if (highlight) highlight.textContent = '';
      if (suffix) suffix.textContent = '';

      if (this.copyButton) {
        this.copyButton.dataset.copyCode = next;
        this.copyButton.setAttribute('aria-label', `Copy promo code ${next}`);
      }

      const dialog = this.modal?.querySelector('[role="dialog"]');
      if (dialog) dialog.setAttribute('aria-label', next);
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
      this.close();
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

    open(options = {}) {
      if (this.modal.classList.contains('is-open')) return;

      if (options.destination) {
        this.pendingDestination = String(options.destination).trim() || this.pendingDestination;
      }

      if (options.promoCode) {
        this.applyPromoCode(options.promoCode);
      }

      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');
      this.startCountdown();

      const dialog = this.modal.querySelector('[role="dialog"]');
      if (typeof trapFocus === 'function' && dialog) trapFocus(dialog);
    }

    close() {
      if (!this.modal.classList.contains('is-open')) return;

      this.stopCountdown();
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');

      if (typeof removeTrapFocus === 'function') removeTrapFocus(this.closeButton);
    }
  }

  customElements.define('success-opt-in-popup', SuccessOptInPopup);
  window.SuccessOptInPopup = SuccessOptInPopup;
}
