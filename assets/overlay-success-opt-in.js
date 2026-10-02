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
    }

    static open(options = {}) {
      const isMobile = window.matchMedia('(max-width: 749px)').matches;
      const target = isMobile ? 'mobile' : 'desktop';
      const instances = [...SuccessOptInPopup.instances];
      const instance =
        instances.find((popup) => popup.dataset.deviceTarget === target) || instances[0];

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

      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');

      const dialog = this.modal.querySelector('[role="dialog"]');
      if (typeof trapFocus === 'function' && dialog) trapFocus(dialog);
    }

    close() {
      if (!this.modal.classList.contains('is-open')) return;

      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');

      if (typeof removeTrapFocus === 'function') removeTrapFocus(this.closeButton);
    }
  }

  customElements.define('success-opt-in-popup', SuccessOptInPopup);
  window.SuccessOptInPopup = SuccessOptInPopup;
}
