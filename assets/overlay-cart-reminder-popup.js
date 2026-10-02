if (!customElements.get('cart-reminder-popup')) {
  class CartReminderPopup extends HTMLElement {
    static instances = new Set();
    static globalBound = false;
    static browseAutoShowTimer = null;
    static cartPageAutoShowTimer = null;
    static inactivityTimer = null;
    static welcomeAutoShowTimer = null;
    static inactivityListenersBound = false;
    static SCROLL_DEPTH_THRESHOLD = 0.7;
    static cartExitIntentListenersBound = false;
    static lastCartExitIntentAttempt = 0;
    static mobileBottomTapListenersBound = false;
    static lastMobileBottomTapAttempt = 0;
    static BOTTOM_TAP_ZONE_PX = 80;
    static BOTTOM_TAP_COOLDOWN_MS = 8000;
    static fastScrollListenersBound = false;
    static lastFastScrollAttempt = 0;
    static fastScrollSamples = [];
    static FAST_SCROLL_WINDOW_MS = 300;
    static FAST_SCROLL_DOWN_DISTANCE_PX = 250;
    static FAST_SCROLL_COOLDOWN_MS = 8000;
    /** Welcome and cart reminder must never stack: the second one waits this long. */
    static PEER_COOLDOWN_MS = 2 * 60 * 1000;
    static lastKlaviyoConversionAt = 0;
    static klaviyoNetworkObserver = null;
    static deviceMediaBound = false;
    static klaviyoOnsiteSubscribeListenerBound = false;
    static klaviyoScanTimer = null;
    static klaviyoScanPending = false;
    static klaviyoLayoutNudged = false;

    constructor() {
      super();
      this.modal = this.querySelector('.cart-reminder-popup');
      this.overlay = this.querySelector('.cart-reminder-popup__overlay');
      this.closeButton = this.querySelector('.cart-reminder-popup__close');
      this.emailInput = this.querySelector('.cart-reminder-popup__email-input');
      this.emailError = this.querySelector('[data-email-error]');
      this.submitButton = this.querySelector('[data-cart-reminder-submit]');
      this.dismissButton = this.querySelector('[data-cart-reminder-dismiss]');
      this.scheduledTimer = null;
      this.countdownTimer = null;
      this.cartCount = Number(this.dataset.cartCount || 0);
      this.boundHandlers = {};
    }

    connectedCallback() {
      if (!this.modal) {
        this.modal = this.querySelector('.cart-reminder-popup');
      }
      if (!this.modal) return;

      this.sectionId = this.dataset.sectionId || this.closest('.shopify-section')?.id?.replace('shopify-section-', '') || '';
      this.storageKey = this.dataset.storageKey || 'cart-reminder-popup';
      CartReminderPopup.instances.add(this);
      CartReminderPopup.bindGlobalEventsOnce();
      CartReminderPopup.bindDeviceMediaOnce();
      this.bindModalEvents();
      this.syncDeviceKlaviyoEmbedPresence();
      this.initKlaviyoPrerender();

      if (window.Shopify && Shopify.designMode) {
        this.bindDesignModeEvents();
        if (this.dataset.useKlaviyoEmbed === 'true') {
          window.requestAnimationFrame(() => this.mountKlaviyoEmbed());
        }
        return;
      }

      if (this.dataset.useKlaviyoEmbed === 'true' && this.matchesDeviceTarget()) {
        this.bootstrapKlaviyoEmbed();
      }

      if (this.dataset.enabled !== 'true') return;

      this.initTriggers();
    }

    disconnectedCallback() {
      CartReminderPopup.instances.delete(this);
      this.unbindDesignModeEvents();
      this.clearTimers();
      this.stopCountdown();
    }

    static debugLog(hypothesisId, location, message, data) {
      if (sessionStorage.getItem('cart-reminder-debug') !== '1') return;

      fetch('http://127.0.0.1:7487/ingest/655161ec-99e0-4c76-93d1-3fd0a8bd9706', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'c87c67' },
        body: JSON.stringify({
          sessionId: 'c87c67',
          hypothesisId,
          location,
          message,
          data,
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }

    static bindGlobalEventsOnce() {
      if (CartReminderPopup.globalBound) return;
      CartReminderPopup.globalBound = true;

      document.addEventListener(
        'click',
        (event) => {
          CartReminderPopup.instances.forEach((instance) => instance.handleCheckoutIntent(event));
        },
        true
      );

      document.addEventListener(
        'submit',
        (event) => {
          CartReminderPopup.instances.forEach((instance) => instance.handleCheckoutSubmit(event));
        },
        true
      );

      if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
        subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
          CartReminderPopup.instances.forEach((instance) => instance.handleCartUpdate());
        });
      }

      CartReminderPopup.bindCartExitIntentListenersOnce();
      CartReminderPopup.bindMobileBottomTapListenersOnce();
      CartReminderPopup.bindFastScrollListenersOnce();
      CartReminderPopup.bindInactivityListenersOnce();
      CartReminderPopup.bindKlaviyoFormListenersOnce();
      CartReminderPopup.bindKlaviyoOnsiteSubscribeListenerOnce();
    }

    static bindKlaviyoOnsiteSubscribeListenerOnce() {
      if (CartReminderPopup.klaviyoOnsiteSubscribeListenerBound) return;
      CartReminderPopup.klaviyoOnsiteSubscribeListenerBound = true;

      window.addEventListener('klaviyo-onsite-subscribe-result', (event) => {
        const detail = event.detail || {};
        const { ok, status } = detail;

        CartReminderPopup.debugLog('W', 'onsiteSubscribeResult:event', 'subscribe result received', {
          ok: Boolean(ok),
          status: status || 0,
          hostname: window.location.hostname,
        });

        if (!ok) return;

        CartReminderPopup.instances.forEach((instance) => {
          const formId = (instance.dataset.klaviyoFormId || '').trim();
          if (!formId || !instance.modal?.classList.contains('is-open')) return;

          instance.completeKlaviyoSubmit(formId, 'onsite-subscribe-ok');
        });
      });
    }

    static bindDeviceMediaOnce() {
      if (CartReminderPopup.deviceMediaBound) return;
      CartReminderPopup.deviceMediaBound = true;

      window.matchMedia('(max-width: 749px)').addEventListener('change', () => {
        CartReminderPopup.instances.forEach((instance) => instance.syncDeviceKlaviyoEmbedPresence());

        const activeInstance = [...CartReminderPopup.instances].find((instance) => instance.matchesDeviceTarget());
        activeInstance?.bootstrapKlaviyoEmbed();
      });
    }

    static hasOpenLockedKlaviyoEmbed() {
      for (const instance of CartReminderPopup.instances) {
        if (!instance.modal?.classList.contains('is-open')) continue;

        const slot = instance.querySelector('[data-klaviyo-embed-slot]');
        if (slot?.dataset.klaviyoEmbedLocked === 'true') return true;
      }

      return false;
    }

    static bindKlaviyoFormListenersOnce() {
      if (CartReminderPopup.klaviyoFormListenersBound) return;
      CartReminderPopup.klaviyoFormListenersBound = true;

      window.addEventListener('klaviyoForms', (event) => {
        CartReminderPopup.handleKlaviyoFormSubmit(event);
      });
    }

    static handleKlaviyoFormSubmit(event) {
      const detail = event.detail || {};
      const eventType = detail.type || '';

      CartReminderPopup.debugLog('N', 'handleKlaviyoFormSubmit', 'klaviyoForms event', {
        type: eventType,
        formId: detail.formId || '',
        stepName: detail.metaData?.$step_name || '',
        hasEmail: Boolean(detail.metaData?.$email),
      });

      const isConversion =
        eventType === 'submit' ||
        eventType === 'redirectedToUrl' ||
        (eventType === 'stepSubmit' && Boolean(detail.metaData?.$email));

      if (!isConversion) return;

      CartReminderPopup.lastKlaviyoConversionAt = Date.now();

      const submittedFormId = detail.formId || '';

      CartReminderPopup.instances.forEach((instance) => {
        const formId = (instance.dataset.klaviyoFormId || '').trim();
        if (!formId || submittedFormId !== formId) return;

        instance.completeKlaviyoSubmit(formId, 'klaviyoForms-event');
      });
    }

    static bindCartExitIntentListenersOnce() {
      if (CartReminderPopup.cartExitIntentListenersBound) return;
      CartReminderPopup.cartExitIntentListenersBound = true;

      document.addEventListener('mouseout', (event) => {
        CartReminderPopup.instances.forEach((instance) => instance.handleExitIntent(event));
      });
    }

    static isMobileViewport() {
      return window.matchMedia('(max-width: 749px)').matches;
    }

    static getPointerClientY(event) {
      if (event.touches?.[0]) return event.touches[0].clientY;
      if (event.changedTouches?.[0]) return event.changedTouches[0].clientY;
      return event.clientY;
    }

    static isInMobileBottomTapZone(clientY) {
      if (clientY == null || Number.isNaN(clientY)) return false;

      const viewport = window.visualViewport;
      const height = viewport?.height ?? window.innerHeight;
      const offsetTop = viewport?.offsetTop ?? 0;
      const relativeY = clientY - offsetTop;

      return relativeY >= height - CartReminderPopup.BOTTOM_TAP_ZONE_PX;
    }

    static bindMobileBottomTapListenersOnce() {
      if (CartReminderPopup.mobileBottomTapListenersBound) return;
      CartReminderPopup.mobileBottomTapListenersBound = true;

      const handleBottomTap = (event) => {
        if (window.Shopify?.designMode) return;
        if (!CartReminderPopup.isMobileViewport()) return;

        const clientY = CartReminderPopup.getPointerClientY(event);
        if (!CartReminderPopup.isInMobileBottomTapZone(clientY)) return;

        const target = event.target instanceof Element ? event.target : null;
        if (target?.closest('.cart-reminder-popup, cart-drawer')) return;

        const now = Date.now();
        if (now - CartReminderPopup.lastMobileBottomTapAttempt < CartReminderPopup.BOTTOM_TAP_COOLDOWN_MS) {
          return;
        }
        CartReminderPopup.lastMobileBottomTapAttempt = now;

        CartReminderPopup.instances.forEach((instance) => {
          if (instance.dataset.deviceTarget !== 'mobile') return;
          instance.handleMobileBottomTap();
        });
      };

      window.addEventListener('touchstart', handleBottomTap, { passive: true });
    }

    static bindFastScrollListenersOnce() {
      if (CartReminderPopup.fastScrollListenersBound) return;
      CartReminderPopup.fastScrollListenersBound = true;

      window.addEventListener(
        'scroll',
        () => {
          if (window.Shopify?.designMode) return;

          const now = Date.now();
          const y = window.scrollY;

          CartReminderPopup.fastScrollSamples.push({ t: now, y });
          CartReminderPopup.fastScrollSamples = CartReminderPopup.fastScrollSamples.filter(
            (sample) => now - sample.t <= CartReminderPopup.FAST_SCROLL_WINDOW_MS
          );

          if (CartReminderPopup.fastScrollSamples.length < 2) return;

          let downDistance = 0;
          const samples = CartReminderPopup.fastScrollSamples;

          for (let i = 1; i < samples.length; i += 1) {
            const delta = samples[i].y - samples[i - 1].y;
            if (delta > 0) downDistance += delta;
          }

          if (downDistance < CartReminderPopup.FAST_SCROLL_DOWN_DISTANCE_PX) return;
          if (now - CartReminderPopup.lastFastScrollAttempt < CartReminderPopup.FAST_SCROLL_COOLDOWN_MS) {
            return;
          }

          CartReminderPopup.lastFastScrollAttempt = now;
          CartReminderPopup.fastScrollSamples = [];

          CartReminderPopup.instances.forEach((instance) => instance.handleFastScroll());
        },
        { passive: true }
      );
    }

    static clearBrowseAutoShowTimer() {
      window.clearTimeout(CartReminderPopup.browseAutoShowTimer);
      CartReminderPopup.browseAutoShowTimer = null;
    }

    static clearCartPageAutoShowTimer() {
      window.clearTimeout(CartReminderPopup.cartPageAutoShowTimer);
      CartReminderPopup.cartPageAutoShowTimer = null;
    }

    static handleCartPageAutoShowTimeout() {
      CartReminderPopup.cartPageAutoShowTimer = null;

      const instance = [...CartReminderPopup.instances].find(
        (candidate) =>
          candidate.dataset.enabled === 'true' &&
          candidate.matchesDeviceTarget() &&
          candidate.isCartPage()
      );

      if (instance) {
        instance.tryOpen('cart-page-auto-show', { allowOnCart: true });
      }
    }

    static handleBrowseAutoShowTimeout() {
      CartReminderPopup.browseAutoShowTimer = null;

      const instance = [...CartReminderPopup.instances].find(
        (candidate) =>
          candidate.dataset.storageKey !== 'welcome-popup' &&
          candidate.dataset.enabled === 'true' &&
          candidate.matchesDeviceTarget()
      );

      if (instance) {
        instance.scheduleEligibleShow('browse-auto-show');
      }
    }

    static bindInactivityListenersOnce() {
      if (CartReminderPopup.inactivityListenersBound) return;
      CartReminderPopup.inactivityListenersBound = true;

      const reset = () => CartReminderPopup.resetInactivityFromActivity();

      ['mousedown', 'keydown', 'touchstart', 'click', 'scroll'].forEach((event) => {
        window.addEventListener(event, reset, { passive: true });
      });
    }

    static getScrollDepthPercent() {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      if (maxScroll <= 0) return 1;

      return window.scrollY / maxScroll;
    }

    static hasRequiredScrollDepth() {
      return CartReminderPopup.getScrollDepthPercent() >= CartReminderPopup.SCROLL_DEPTH_THRESHOLD;
    }

    static resetInactivityFromActivity() {
      const popupIsOpen = [...CartReminderPopup.instances].some((instance) =>
        instance.modal?.classList.contains('is-open')
      );
      if (popupIsOpen) return;

      CartReminderPopup.instances.forEach((instance) => {
        if (instance.isWelcomePopup()) return;
        if (instance.isBlockedPage()) return;
        if (instance.dataset.enabled !== 'true') return;
        if (instance.cartCount <= 0) return;

        instance.armInactivityTimer();
      });
    }

    static clearInactivityTimer() {
      window.clearTimeout(CartReminderPopup.inactivityTimer);
      CartReminderPopup.inactivityTimer = null;
    }

    static clearAutoShowTimers() {
      CartReminderPopup.clearBrowseAutoShowTimer();
      CartReminderPopup.clearCartPageAutoShowTimer();
      CartReminderPopup.clearInactivityTimer();
    }

    static handleInactivityTimeout() {
      CartReminderPopup.inactivityTimer = null;

      if (!CartReminderPopup.hasRequiredScrollDepth()) return;

      const instance = [...CartReminderPopup.instances].find(
        (candidate) =>
          candidate.dataset.storageKey !== 'welcome-popup' &&
          candidate.dataset.enabled === 'true' &&
          candidate.matchesDeviceTarget() &&
          !candidate.isBlockedPage()
      );

      if (instance) {
        instance.scheduleEligibleShow('inactivity');
      }
    }

    bindDesignModeEvents() {
      this.boundHandlers.sectionSelect = (event) => {
        CartReminderPopup.syncDesignModeSelection(event.detail.sectionId);
      };

      this.boundHandlers.sectionLoad = (event) => {
        CartReminderPopup.syncDesignModeSelection(event.detail.sectionId);
      };

      document.addEventListener('shopify:section:select', this.boundHandlers.sectionSelect);
      document.addEventListener('shopify:section:deselect', this.boundHandlers.sectionSelect);
      document.addEventListener('shopify:section:load', this.boundHandlers.sectionLoad);

      CartReminderPopup.syncDesignModeSelection(CartReminderPopup.getSelectedSectionId());
    }

    static getSelectedSectionId() {
      const fromUrl = new URLSearchParams(window.location.search).get('section');
      if (fromUrl) return fromUrl;

      const selectedSection = document.querySelector('.shopify-section.shopify-section-group-overlay-group.shopify-section--selected');
      if (selectedSection?.id) {
        return selectedSection.id.replace('shopify-section-', '');
      }

      return null;
    }

    static syncDesignModeSelection(selectedSectionId) {
      if (!window.Shopify?.designMode) return;

      const activeSectionId = selectedSectionId || CartReminderPopup.getSelectedSectionId();

      CartReminderPopup.instances.forEach((instance) => {
        if (activeSectionId && instance.sectionId === activeSectionId) {
          // Keep editor preview honest: don't force-open Welcome on excluded product codes.
          if (instance.isWelcomePopup() && instance.isProductCodeExcluded()) {
            instance.close(false, { skipTeaser: true });
            return;
          }
          instance.open(true);
          return;
        }

        instance.close(false);
      });
    }

    unbindDesignModeEvents() {
      document.removeEventListener('shopify:section:select', this.boundHandlers.sectionSelect);
      document.removeEventListener('shopify:section:deselect', this.boundHandlers.sectionSelect);
      document.removeEventListener('shopify:section:load', this.boundHandlers.sectionLoad);
    }

    bindModalEvents() {
      this.boundHandlers.submitClick = this.handleSubmitClick.bind(this);
      this.boundHandlers.emailInput = () => {
        this.clearEmailError();
        this.syncWelcomeSubmitGate();
      };
      this.boundHandlers.emailKeydown = (event) => {
        if (!this.isWelcomePopup()) return;
        if (event.key !== 'Enter') return;
        event.preventDefault();
        this.handleSubmitClick();
      };

      this.closeButton?.addEventListener('click', () => this.close(true));
      this.overlay?.addEventListener('click', () => this.close(true));
      this.dismissButton?.addEventListener('click', () => this.close(true));
      this.submitButton?.addEventListener('click', this.boundHandlers.submitClick);
      this.emailInput?.addEventListener('input', this.boundHandlers.emailInput);
      this.emailInput?.addEventListener('keydown', this.boundHandlers.emailKeydown);
      this.modal.addEventListener('keyup', (event) => {
        if (event.code?.toUpperCase() === 'ESCAPE') this.close(true);
      });

      this.syncWelcomeSubmitGate();
    }

    /** Welcome Step1: Get My Discount only when email looks valid. */
    syncWelcomeSubmitGate() {
      if (!this.isWelcomePopup() || !this.submitButton) return;

      const email = this.emailInput?.value.trim() || '';
      const ok = this.isValidEmail(email);
      this.submitButton.disabled = !ok;
      this.submitButton.setAttribute('aria-disabled', ok ? 'false' : 'true');
      this.submitButton.classList.toggle('is-disabled', !ok);
    }

    static afterCartAddDelayStorageKey() {
      return 'cart-reminder-popup-after-cart-add-delay';
    }

    static markAfterCartAddDelay() {
      sessionStorage.setItem(CartReminderPopup.afterCartAddDelayStorageKey(), '1');
    }

    static shouldUseAfterCartAddDelay() {
      return sessionStorage.getItem(CartReminderPopup.afterCartAddDelayStorageKey()) === '1';
    }

    static clearAfterCartAddDelay() {
      sessionStorage.removeItem(CartReminderPopup.afterCartAddDelayStorageKey());
    }

    visitedCartStorageKey() {
      return `${this.storageKey}-visited-cart`;
    }

    markVisitedCart() {
      if (this.cartCount <= 0) return;
      localStorage.setItem(this.visitedCartStorageKey(), '1');
    }

    hasVisitedCart() {
      return localStorage.getItem(this.visitedCartStorageKey()) === '1';
    }

    static clearVisitedCart(storageKey = 'cart-reminder-popup') {
      localStorage.removeItem(`${storageKey}-visited-cart`);
    }

    initTriggers() {
      if (this.isWelcomePopup()) {
        this.initWelcomeTriggers();
        return;
      }

      if (sessionStorage.getItem(this.checkoutNavKey()) === '1') {
        sessionStorage.removeItem(this.checkoutNavKey());
        return;
      }

      if (this.dataset.enabled !== 'true') return;
      if (this.cartCount <= 0) return;

      if (this.isBlockedPage()) {
        CartReminderPopup.clearAfterCartAddDelay();
      }

      const afterCartAdd = !this.isBlockedPage() && CartReminderPopup.shouldUseAfterCartAddDelay();
      this.armBrowseAutoShowTimer({ afterCartAdd });

      if (!this.isBlockedPage()) {
        this.armInactivityTimer();
      }

      if (this.isCartPage()) {
        this.markVisitedCart();
        this.armCartPageAutoShowTimer();
      }
    }

    scheduleEligibleShow(source) {
      if (this.dataset.enabled !== 'true') return;
      if (!this.matchesDeviceTarget()) return;
      if (this.isWelcomePopup()) {
        if (this.isCheckoutPage()) return;
      } else if (this.isBlockedPage()) {
        return;
      }
      if (this.modal?.classList.contains('is-open')) return;

      this.scheduleOpen(0, source);
    }

    getBrowseAutoShowMs(options = {}) {
      const useAfterCartDelay = Boolean(options.afterCartAdd);
      const seconds = useAfterCartDelay
        ? Number(this.dataset.browseAutoShowAfterCartTime ?? 60)
        : Number(this.dataset.browseAutoShowTime ?? 60);
      if (!Number.isFinite(seconds) || seconds <= 0) return 0;

      return seconds * 1000;
    }

    armBrowseAutoShowTimer(options = {}) {
      const afterCartAdd = Boolean(options.afterCartAdd);
      const delayMs = this.getBrowseAutoShowMs({ afterCartAdd });
      if (!delayMs) return;
      if (this.cartCount <= 0) return;

      CartReminderPopup.clearBrowseAutoShowTimer();

      CartReminderPopup.browseAutoShowTimer = window.setTimeout(() => {
        CartReminderPopup.handleBrowseAutoShowTimeout();
      }, delayMs);
    }

    getInactivityMs() {
      const seconds = Number(this.dataset.inactivityTime ?? 20);
      if (!Number.isFinite(seconds) || seconds <= 0) return 0;

      return seconds * 1000;
    }

    armInactivityTimer() {
      if (this.isWelcomePopup()) return;

      const delayMs = this.getInactivityMs();
      if (!delayMs) return;
      if (this.cartCount <= 0) return;
      if (this.isBlockedPage()) return;

      CartReminderPopup.clearInactivityTimer();

      CartReminderPopup.inactivityTimer = window.setTimeout(() => {
        CartReminderPopup.handleInactivityTimeout();
      }, delayMs);
    }

    getCartPageAutoShowMs() {
      const seconds = Number(this.dataset.cartPageAutoShowTime ?? 120);
      if (!Number.isFinite(seconds) || seconds <= 0) return 0;

      return seconds * 1000;
    }

    armCartPageAutoShowTimer() {
      if (!this.isCartPage()) return;

      const delayMs = this.getCartPageAutoShowMs();
      if (!delayMs) return;
      if (this.cartCount <= 0) return;

      if (CartReminderPopup.cartPageAutoShowTimer) return;

      CartReminderPopup.cartPageAutoShowTimer = window.setTimeout(() => {
        CartReminderPopup.handleCartPageAutoShowTimeout();
      }, delayMs);
    }

    isBlockedPage() {
      return this.isCartPage() || this.isCheckoutPage();
    }

    matchesDeviceTarget() {
      const target = this.dataset.deviceTarget || 'desktop';
      const isMobile = window.matchMedia('(max-width: 749px)').matches;

      if (target === 'mobile') return isMobile;
      return !isMobile;
    }

    checkoutNavKey() {
      return `${this.storageKey}-checkout-nav`;
    }

    sessionShownKey() {
      return `${this.storageKey}-session-shown`;
    }

    wasShownThisSession() {
      if (this.dataset.oncePerSession === 'false') return false;
      return sessionStorage.getItem(this.sessionShownKey()) === '1';
    }

    markSessionShown() {
      sessionStorage.setItem(this.sessionShownKey(), '1');
    }

    isWelcomePopup() {
      return this.storageKey === 'welcome-popup';
    }

    peerStorageKey() {
      return this.isWelcomePopup() ? 'cart-reminder-popup' : 'welcome-popup';
    }

    isPeerOpen() {
      return [...CartReminderPopup.instances].some(
        (other) =>
          other !== this &&
          other.isWelcomePopup() !== this.isWelcomePopup() &&
          other.modal?.classList.contains('is-open')
      );
    }

    /** 0 = free to open. Otherwise how long until the other popup's turn is over. */
    peerCooldownLeftMs() {
      const shownAt = Number(window.localStorage.getItem(this.peerStorageKey()));
      if (shownAt && !Number.isNaN(shownAt)) {
        const left = CartReminderPopup.PEER_COOLDOWN_MS - (Date.now() - shownAt);
        if (left > 0) return left;
      }
      // Cooldown over but the other one is still on screen — wait for it to close.
      return this.isPeerOpen() ? 5000 : 0;
    }

    getWelcomeAutoShowMs() {
      const seconds = Number(this.dataset.welcomeAutoShowTime ?? 10);
      if (!Number.isFinite(seconds) || seconds <= 0) return 0;

      return seconds * 1000;
    }

    static clearWelcomeAutoShowTimer() {
      window.clearTimeout(CartReminderPopup.welcomeAutoShowTimer);
      CartReminderPopup.welcomeAutoShowTimer = null;
    }

    static handleWelcomeAutoShowTimeout() {
      CartReminderPopup.welcomeAutoShowTimer = null;

      const instance = [...CartReminderPopup.instances].find(
        (candidate) =>
          candidate.dataset.storageKey === 'welcome-popup' &&
          candidate.dataset.enabled === 'true' &&
          candidate.matchesDeviceTarget()
      );

      if (instance) {
        instance.scheduleEligibleShow('welcome-auto-show');
      }
    }

    initWelcomeTriggers() {
      if (this.dataset.enabled !== 'true') return;
      if (this.isCheckoutPage()) return;

      this.armWelcomeAutoShowTimer();
    }

    armWelcomeAutoShowTimer() {
      const delayMs = this.getWelcomeAutoShowMs();
      if (!delayMs) return;

      CartReminderPopup.clearWelcomeAutoShowTimer();

      CartReminderPopup.welcomeAutoShowTimer = window.setTimeout(() => {
        CartReminderPopup.handleWelcomeAutoShowTimeout();
      }, delayMs);
    }

    isCartPage() {
      const pageType = this.dataset.pageType || '';
      const path = (this.dataset.currentPath || window.location.pathname).toLowerCase();
      return pageType === 'cart' || path === '/cart';
    }

    isCheckoutPage() {
      const pageType = this.dataset.pageType || '';
      const path = (this.dataset.currentPath || window.location.pathname).toLowerCase();
      return pageType === 'checkout' || path.startsWith('/checkout') || path.includes('/checkouts/');
    }

    isCheckoutUrl(url) {
      if (!url) return false;

      try {
        const parsed = new URL(url, window.location.origin);
        return parsed.pathname.startsWith('/checkout') || parsed.pathname.includes('/checkouts/');
      } catch (error) {
        return /checkout/i.test(String(url));
      }
    }

    isCheckoutTarget(element) {
      if (!element) return false;

      if (element.matches?.('button[name="checkout"], #checkout, .cart__checkout-button')) {
        return true;
      }

      const href = element.getAttribute?.('href') || element.getAttribute?.('formaction') || '';
      return this.isCheckoutUrl(href);
    }

    handleCheckoutIntent(event) {
      if (!this.isCartPage()) return;

      const target = event.target.closest('a[href], button[name="checkout"], #checkout, .cart__checkout-button');
      if (!this.isCheckoutTarget(target)) return;

      sessionStorage.setItem(this.checkoutNavKey(), '1');
      CartReminderPopup.clearAutoShowTimers();
    }

    handleCheckoutSubmit(event) {
      if (!this.isCartPage()) return;

      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      const checkoutButton = form.querySelector('[name="checkout"]');
      const action = form.getAttribute('action') || '';

      if (checkoutButton || this.isCheckoutUrl(action)) {
        sessionStorage.setItem(this.checkoutNavKey(), '1');
        CartReminderPopup.clearAutoShowTimers();
      }
    }

    handleExitIntent(event) {
      if (this.isWelcomePopup()) return;
      if (this.isBlockedPage()) return;
      if (this.dataset.enabled !== 'true') return;
      if (!this.matchesDeviceTarget()) return;
      if (this.modal?.classList.contains('is-open')) return;

      const towardBrowserChrome = event.clientY < 20;
      const leftViewport =
        event.relatedTarget == null &&
        (event.clientY <= 0 ||
          event.clientX <= 0 ||
          event.clientX >= window.innerWidth - 1 ||
          event.clientY >= window.innerHeight - 1);

      if (!towardBrowserChrome && !leftViewport) return;

      const now = Date.now();
      if (now - CartReminderPopup.lastCartExitIntentAttempt < 800) return;
      CartReminderPopup.lastCartExitIntentAttempt = now;

      this.scheduleEligibleShow('exit-intent');
    }

    handleMobileBottomTap() {
      if (this.isWelcomePopup()) return;
      if (this.dataset.deviceTarget !== 'mobile') return;
      if (this.isBlockedPage()) return;
      if (this.dataset.enabled !== 'true') return;
      if (!this.matchesDeviceTarget()) return;
      if (this.modal?.classList.contains('is-open')) return;

      this.scheduleEligibleShow('mobile-bottom-tap');
    }

    handleFastScroll() {
      if (this.isWelcomePopup()) return;
      if (this.isBlockedPage()) return;
      if (this.dataset.enabled !== 'true') return;
      if (!this.matchesDeviceTarget()) return;
      if (this.modal?.classList.contains('is-open')) return;

      this.scheduleEligibleShow('fast-scroll');
    }

    async handleCartUpdate() {
      await this.refreshCartCount({ fromCartUpdate: true });
    }

    async refreshCartCount(options = {}) {
      if (this.isWelcomePopup()) {
        return Number(this.dataset.cartCount || 0);
      }

      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        this.cartCount = cart.item_count || 0;
        this.dataset.cartCount = String(this.cartCount);

        CartReminderPopup.instances.forEach((instance) => {
          instance.cartCount = this.cartCount;
          instance.dataset.cartCount = String(this.cartCount);
        });

        if (this.cartCount <= 0) {
          CartReminderPopup.clearAutoShowTimers();
          CartReminderPopup.clearAfterCartAddDelay();
          CartReminderPopup.clearVisitedCart(this.storageKey);
        } else {
          if (options.fromCartUpdate) {
            CartReminderPopup.markAfterCartAddDelay();
          }

          const afterCartAdd =
            options.fromCartUpdate || CartReminderPopup.shouldUseAfterCartAddDelay();

          CartReminderPopup.instances.forEach((instance) => {
            if (instance.isWelcomePopup()) return;
            if (instance.dataset.enabled !== 'true') return;
            instance.armBrowseAutoShowTimer({ afterCartAdd });
            if (!instance.isBlockedPage()) {
              instance.armInactivityTimer();
            }
          });
        }

        return this.cartCount;
      } catch (error) {
        this.cartCount = Number(this.dataset.cartCount || 0);
        return this.cartCount;
      }
    }

    static formatCartMoney(cents) {
      const amount = Number(cents || 0) / 100;
      const currency = window.Shopify?.currency?.active || 'USD';

      try {
        return new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency',
          currency,
        }).format(amount);
      } catch (error) {
        return `$${amount.toFixed(2)}`;
      }
    }

    static isGiftBoxCartItem(item) {
      if (!item) return false;
      if (item.properties?._addon_gift_box) return true;
      return Object.entries(item.properties || {}).some(
        ([key, value]) => key === '_addon_gift_box' && value != null && value !== ''
      );
    }

    static sortCartItemsForDisplay(items) {
      if (!items?.length) return items;

      return [...items].sort((a, b) => {
        const aGift = CartReminderPopup.isGiftBoxCartItem(a);
        const bGift = CartReminderPopup.isGiftBoxCartItem(b);
        if (aGift === bGift) return 0;
        return aGift ? 1 : -1;
      });
    }

    buildCartItemHtml(item) {
      const imageHtml = item.image
        ? `<img src="${item.image}" alt="${this.escapeHtml(item.product_title || item.title || '')}" loading="lazy" width="60" height="60">`
        : '<div class="cart-reminder-popup__item-media-placeholder"></div>';

      const variantHtml =
        item.product_has_only_default_variant === false && item.variant_title
          ? `<p class="cart-reminder-popup__item-variant">${this.escapeHtml(item.variant_title)}</p>`
          : '';

      const priceHtml =
        item.original_line_price !== item.final_line_price
          ? `<s>${CartReminderPopup.formatCartMoney(item.original_line_price)}</s> ${CartReminderPopup.formatCartMoney(item.final_line_price)}`
          : CartReminderPopup.formatCartMoney(item.final_line_price);

      return `
        <div class="cart-reminder-popup__item">
          <div class="cart-reminder-popup__item-media">${imageHtml}</div>
          <div class="cart-reminder-popup__item-details">
            <p class="cart-reminder-popup__item-title">${this.escapeHtml(item.product_title || item.title || '')}</p>
            ${variantHtml}
            <p class="cart-reminder-popup__item-price">${priceHtml}</p>
          </div>
          <p class="cart-reminder-popup__item-qty">QTY: ${item.quantity}</p>
        </div>
      `;
    }

    escapeHtml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }

    async refreshCartItems() {
      const container = this.querySelector('[data-cart-items]');
      if (!container) return;

      try {
        const response = await fetch('/cart.js');
        const cart = await response.json();
        const maxItems = Number(this.dataset.maxCartItems || 5);
        const allItems = cart.items || [];
        const sortedItems = CartReminderPopup.sortCartItemsForDisplay(allItems);
        const items = sortedItems.slice(0, maxItems);
        const remaining = allItems.length - items.length;

        if (!items.length) {
          container.innerHTML = '';
          return;
        }

        container.innerHTML =
          items.map((item) => this.buildCartItemHtml(item)).join('') +
          (remaining > 0
            ? `<p class="cart-reminder-popup__items-more">+${remaining} more item${remaining !== 1 ? 's' : ''}</p>`
            : '');
      } catch (error) {
        /* keep server-rendered items */
      }
    }

    orderCompletedStorageKey() {
      return this.dataset.orderCompletedKey || 'cart-reminder-order-completed';
    }

    hasRecentOrder() {
      const suppressionDays = Number(this.dataset.orderSuppressionDays ?? 7);
      if (suppressionDays <= 0) return false;

      const completedAt = Number(window.localStorage.getItem(this.orderCompletedStorageKey()));
      if (!completedAt || Number.isNaN(completedAt)) return false;

      return Date.now() - completedAt < suppressionDays * 24 * 60 * 60 * 1000;
    }

    isFrequencyCapped() {
      if (this.dataset.oncePerSession === 'true') return false;

      const capSeconds = Number(this.dataset.frequencyCapSeconds || 0);
      const hours = Number(this.dataset.frequencyCap || 24);
      const lastShown = window.localStorage.getItem(this.storageKey);
      if (!lastShown) return false;

      const capMs =
        capSeconds > 0
          ? capSeconds * 1000
          : hours * 60 * 60 * 1000;

      return Date.now() - Number(lastShown) < capMs;
    }

    isPageExcluded() {
      const pageType = this.dataset.pageType || '';
      if (this.dataset.disableHomepage === 'true' && pageType === 'index') return true;

      const excludedPages = this.getExcludedPages();
      const currentPath = (this.dataset.currentPath || window.location.pathname).toLowerCase();

      return excludedPages.some((path) => {
        if (!path) return false;
        const normalized = path.startsWith('/') ? path : `/${path}`;
        return currentPath === normalized || currentPath.startsWith(`${normalized}/`);
      });
    }

    getExcludedPages() {
      try {
        return JSON.parse(this.dataset.excludedPages || '[]');
      } catch (error) {
        return [];
      }
    }

    getExcludedProductCodes() {
      try {
        return JSON.parse(this.dataset.excludedProductCodes || '[]')
          .map((code) => String(code || '').trim().toLowerCase())
          .filter(Boolean);
      } catch (error) {
        return [];
      }
    }

    /**
     * Product URL handle ends with -{code} (e.g. …-mug-upthah2e13) or equals the code.
     * Handle comes from Liquid data-product-handle, with pathname fallback.
     */
    getProductHandle() {
      const fromData = String(this.dataset.productHandle || '').trim().toLowerCase();
      if (fromData) return fromData;
      const path = String(this.dataset.currentPath || window.location.pathname || '')
        .split('?')[0]
        .toLowerCase();
      const match = path.match(/^\/products\/([^/]+)\/?$/);
      return match ? decodeURIComponent(match[1]) : '';
    }

    isProductCodeExcluded() {
      if (!this.isWelcomePopup()) return false;
      const handle = this.getProductHandle();
      if (!handle) return false;

      const codes = this.getExcludedProductCodes();
      if (!codes.length) return false;

      return codes.some((code) => handle === code || handle.endsWith(`-${code}`));
    }

    canShowWelcome() {
      if (this.dataset.enabled !== 'true') return false;
      if (!this.matchesDeviceTarget()) return false;
      if (this.wasShownThisSession()) return false;
      if (this.hasRecentOrder()) return false;
      if (this.isFrequencyCapped()) return false;
      if (this.isPageExcluded()) return false;
      if (this.isProductCodeExcluded()) return false;
      if (this.isCheckoutPage()) return false;

      return true;
    }

    canShow(options = {}) {
      if (this.isWelcomePopup()) {
        return this.canShowWelcome();
      }

      if (this.dataset.enabled !== 'true') return false;
      if (!this.matchesDeviceTarget()) return false;
      if (this.cartCount <= 0) return false;
      if (this.wasShownThisSession()) return false;
      if (this.hasRecentOrder()) return false;
      if (this.isFrequencyCapped()) return false;
      if (this.isPageExcluded()) return false;
      if (!this.hasVisitedCart()) return false;

      if (this.isCheckoutPage()) return false;
      if (this.isCartPage() && !options.allowOnCart) return false;

      return true;
    }

    scheduleOpen(delayMs, source, options = {}) {
      if (this.modal.classList.contains('is-open')) return;

      window.clearTimeout(this.scheduledTimer);
      this.scheduledTimer = window.setTimeout(() => {
        this.tryOpen(source, options);
      }, delayMs);
    }

    async tryOpen(source, options = {}) {
      if (this.modal.classList.contains('is-open')) return;

      // The other overlay went first — retry once its 2 min are up instead of dropping the show.
      const peerWait = this.peerCooldownLeftMs();
      if (peerWait > 0) {
        this.scheduleOpen(peerWait + 250, source, options);
        return;
      }

      if (this.isWelcomePopup()) {
        if (this.isCheckoutPage()) return;
        if (!this.canShowWelcome()) return;

        this.clearTimers();
        CartReminderPopup.clearWelcomeAutoShowTimer();
        this.open(false);
        return;
      }

      if (this.isCheckoutPage()) return;
      if (this.isCartPage() && !options.allowOnCart) return;

      await this.refreshCartCount();

      if (!this.canShow({ allowOnCart: options.allowOnCart })) return;

      this.clearTimers();
      CartReminderPopup.clearAutoShowTimers();
      this.open(false);
    }

    clearTimers() {
      window.clearTimeout(this.scheduledTimer);
      this.scheduledTimer = null;
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
      return 'cart-reminder-expires-at';
    }

    getCountdownHours() {
      const hours = Number(this.dataset.countdownHours ?? 1);
      if (!Number.isFinite(hours) || hours <= 0) return 1;
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
      const el = this.querySelector('[data-cart-reminder-countdown]');
      if (!el) return false;

      const remaining = Math.max(0, this._countdownExpiresAt - Date.now());
      el.textContent = CartReminderPopup.formatCountdown(remaining);
      return remaining > 0;
    }

    startCountdown() {
      if (this.isWelcomePopup()) return;
      if (!this.querySelector('[data-cart-reminder-countdown]')) return;

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

    /** Load overlay logo/hero/bg only when popup opens — avoid PDP prefetch waste. */
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

    async open(isPreview) {
      if (this.modal.classList.contains('is-open')) return;

      if (this.isWelcomePopup()) {
        CartReminderPopup.clearWelcomeAutoShowTimer();
        window.WelcomeStep2Popup?.hideActiveTeaser?.();
      } else {
        CartReminderPopup.clearAutoShowTimers();
      }

      this.armDeferredMedia();

      if (!this.isWelcomePopup()) {
        await this.refreshCartItems();
        this.startCountdown();
      }

      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('overflow-hidden');

      const dialog = this.modal.querySelector('[role="dialog"]');
      if (typeof trapFocus === 'function' && dialog) trapFocus(dialog);

      if (!isPreview) {
        this.markShown();
        this.markSessionShown();
        CartReminderPopup.clearAfterCartAddDelay();
      }

      this.syncKlaviyoEmbedVisibility();
      this.mountKlaviyoEmbed();
    }

    close(shouldRemember, options = {}) {
      if (!this.modal.classList.contains('is-open')) return;

      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && this.modal.contains(activeElement)) {
        activeElement.blur();
      }

      this.stopCountdown();
      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('overflow-hidden');

      if (typeof removeTrapFocus === 'function') removeTrapFocus(this.closeButton);

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      if (slot) {
        delete slot.dataset.klaviyoEmbedLocked;
        delete slot.dataset.nativeSubmitBound;
      }

      this.klaviyoSubmitAbort?.abort();
      this.klaviyoSubmitAbort = null;
      this.setSubmitLoading(false);

      if (shouldRemember) {
        this.markShown();
      }

      if (this.isWelcomePopup() && !options.skipTeaser) {
        window.WelcomeStep2Popup?.showActiveTeaser?.();
      }
    }

    markShown() {
      window.localStorage.setItem(this.storageKey, String(Date.now()));
    }

    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
    }

    clearEmailError() {
      this.emailInput?.classList.remove('cart-reminder-popup__email-input--error');
      if (this.emailError) this.emailError.hidden = true;
    }

    showEmailError() {
      this.emailInput?.classList.add('cart-reminder-popup__email-input--error');
      if (this.emailError) this.emailError.hidden = false;
      this.emailInput?.focus();
    }

    setSubmitLoading(isLoading) {
      if (!this.submitButton) return;

      this.submitButton.classList.toggle('is-loading', isLoading);
      this.submitButton.querySelector('.cart-reminder-popup__button-loading')?.toggleAttribute('hidden', !isLoading);

      if (this.isWelcomePopup()) {
        if (isLoading) {
          this.submitButton.disabled = true;
          this.submitButton.setAttribute('aria-disabled', 'true');
        } else {
          this.syncWelcomeSubmitGate();
        }
        return;
      }

      this.submitButton.disabled = isLoading;
    }

    getKlaviyoCompanyId() {
      const configuredId = (this.dataset.klaviyoCompanyId || '').trim();
      if (configuredId) return configuredId;

      const fromKlaviyo = window.klaviyo?.companyId ?? window.klaviyo?.account;
      if (typeof fromKlaviyo === 'string' && fromKlaviyo.trim()) return fromKlaviyo.trim();

      const script = document.querySelector('script[src*="klaviyo.com"][src*="company_id="]');
      if (script) {
        const match = script.src.match(/company_id=([^&]+)/);
        if (match?.[1]) return decodeURIComponent(match[1]);
      }

      return null;
    }

    getKlaviyoListId() {
      const desktopId = (this.dataset.klaviyoListIdDesktop || '').trim();
      const mobileId = (this.dataset.klaviyoListIdMobile || '').trim();
      const fallbackId = (this.dataset.klaviyoListId || '').trim();
      const target = this.dataset.deviceTarget || 'desktop';

      if (target === 'mobile' && mobileId) return mobileId;
      if (target === 'desktop' && desktopId) return desktopId;

      return fallbackId || mobileId || desktopId;
    }

    async subscribeToKlaviyo(email) {
      const listId = this.getKlaviyoListId();
      if (!listId) return { ok: false, skipped: true, reason: 'missing_list_id' };

      const companyId = this.getKlaviyoCompanyId();
      if (!companyId) return { ok: false, skipped: true, reason: 'missing_company_id' };

      try {
        const response = await fetch(`https://a.klaviyo.com/client/subscriptions/?company_id=${encodeURIComponent(companyId)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            revision: '2024-07-15',
          },
          body: JSON.stringify({
            data: {
              type: 'subscription',
              attributes: {
                custom_source: this.isWelcomePopup() ? 'Welcome Popup' : 'Cart Reminder Popup',
                profile: {
                  data: {
                    type: 'profile',
                    attributes: {
                      email,
                    },
                  },
                },
              },
              relationships: {
                list: {
                  data: {
                    type: 'list',
                    id: listId,
                  },
                },
              },
            },
          }),
        });

        if (response.ok) return { ok: true };

        return { ok: false, reason: 'request_failed', status: response.status };
      } catch (error) {
        return { ok: false, reason: 'network_error', error };
      }
    }

    static runKlaviyoScan(includeLayoutNudge) {
      window._klOnsite = window._klOnsite || [];
      window._klOnsite.push(['refreshForms']);

      if (includeLayoutNudge && !CartReminderPopup.klaviyoLayoutNudged) {
        CartReminderPopup.klaviyoLayoutNudged = true;
        window.dispatchEvent(new Event('resize'));
      }
    }

    triggerKlaviyoScan(force) {
      if (!force && CartReminderPopup.hasOpenLockedKlaviyoEmbed()) {
        CartReminderPopup.debugLog('S', 'triggerKlaviyoScan', 'skipped refreshForms', {
          reason: 'embed-locked-open',
        });
        return;
      }

      if (force) {
        window.clearTimeout(CartReminderPopup.klaviyoScanTimer);
        CartReminderPopup.klaviyoScanPending = false;
        CartReminderPopup.runKlaviyoScan(true);
        return;
      }

      if (CartReminderPopup.klaviyoScanPending) return;
      CartReminderPopup.klaviyoScanPending = true;

      CartReminderPopup.klaviyoScanTimer = window.setTimeout(() => {
        CartReminderPopup.klaviyoScanPending = false;
        CartReminderPopup.runKlaviyoScan(false);
      }, 350);
    }

    syncDeviceKlaviyoEmbedPresence() {
      if (this.dataset.useKlaviyoEmbed !== 'true') return;

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      const formId = (this.dataset.klaviyoFormId || '').trim();
      if (!slot || !formId) return;

      const active = this.matchesDeviceTarget();

      if (!active) {
        delete slot.dataset.klaviyoEmbedLocked;
        return;
      }

      if (!this.getKlaviyoEmbedTarget(slot, formId)) {
        this.ensureKlaviyoEmbedTarget(slot, formId);
        CartReminderPopup.debugLog('S', 'syncDeviceKlaviyoEmbedPresence', 'ensured active device embed', {
          formId,
          deviceTarget: this.dataset.deviceTarget || '',
        });
      }
    }

    bootstrapKlaviyoEmbed() {
      if (this.dataset.useKlaviyoEmbed !== 'true') return;
      if (!this.matchesDeviceTarget()) return;

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      const formId = (this.dataset.klaviyoFormId || '').trim();
      if (!slot || !formId) return;

      this.ensureKlaviyoEmbedTarget(slot, formId);
      this.bindKlaviyoEmbedObserver(slot, formId);

      let attempts = 0;
      const maxAttempts = 8;

      const probe = () => {
        attempts += 1;

        if (this.hasKlaviyoEmbedContent(slot, formId)) {
          this.syncKlaviyoEmbedVisibility();
          CartReminderPopup.debugLog('S', 'bootstrapKlaviyoEmbed', 'embed ready', {
            formId,
            deviceTarget: this.dataset.deviceTarget || '',
            attempts,
          });
          return;
        }

        this.triggerKlaviyoScan(attempts === 1);

        if (attempts < maxAttempts) {
          window.setTimeout(probe, attempts <= 2 ? 500 : 900);
        }
      };

      window.requestAnimationFrame(probe);
    }

    ensureKlaviyoEmbedTarget(slot, formId) {
      if (!slot || !formId) return null;

      const existing = slot.querySelector(`.klaviyo-form-${formId}`);

      if (existing && this.hasKlaviyoEmbedContent(slot, formId)) {
        CartReminderPopup.debugLog('H', 'ensureKlaviyoEmbedTarget', 'kept injected embed', {
          formId,
          childCount: existing.childElementCount,
          cartOpen: this.modal?.classList.contains('is-open'),
        });
        return existing;
      }

      if (existing) {
        CartReminderPopup.debugLog('H', 'ensureKlaviyoEmbedTarget', 'kept empty embed div', {
          formId,
          cartOpen: this.modal?.classList.contains('is-open'),
        });
        return existing;
      }

      delete slot.dataset.embedObserverBound;

      const embedTarget = document.createElement('div');
      embedTarget.className = `klaviyo-form-${formId}`;

      const fallback = slot.querySelector('[data-klaviyo-fallback]');
      if (fallback) slot.insertBefore(embedTarget, fallback);
      else slot.appendChild(embedTarget);

      CartReminderPopup.debugLog('F', 'ensureKlaviyoEmbedTarget', 'created embed div', {
        formId,
        cartOpen: this.modal?.classList.contains('is-open'),
      });

      return embedTarget;
    }

    getKlaviyoEmbedTarget(root, formId) {
      if (!root || !formId) return null;
      return root.querySelector(`.klaviyo-form-${formId}`);
    }

    hasKlaviyoEmbedContent(root, formId) {
      const target = this.getKlaviyoEmbedTarget(root, formId);
      if (!target || target.childElementCount === 0) return false;

      return Boolean(
        target.querySelector(
          'input[type="email"], input[name="email"], form, button[type="submit"], .klaviyo-form-version-cid'
        )
      );
    }

    initKlaviyoPrerender() {
      if (this.dataset.useKlaviyoEmbed !== 'true') return;
      if (this.dataset.klaviyoReplacesContent !== 'true') return;
      if (!this.querySelector('[data-klaviyo-prerender]')) return;

      this.triggerKlaviyoScan();

      let attempts = 0;
      const timer = window.setInterval(() => {
        attempts += 1;
        this.triggerKlaviyoScan(attempts === 1);

        const formId = (this.dataset.klaviyoFormId || '').trim();
        const prerender = this.querySelector('[data-klaviyo-prerender]');
        if (formId && this.hasKlaviyoEmbedContent(prerender, formId)) {
          window.clearInterval(timer);
        }

        if (attempts >= 10) window.clearInterval(timer);
      }, 900);
    }

    waitForKlaviyoEmbed(maxWaitMs) {
      return new Promise((resolve) => {
        const formId = (this.dataset.klaviyoFormId || '').trim();
        if (!formId) {
          resolve(false);
          return;
        }

        const deadline = Date.now() + maxWaitMs;

        const probe = () => {
          const prerender = this.querySelector('[data-klaviyo-prerender]');
          const slot = this.querySelector('[data-klaviyo-embed-slot]');
          const ready =
            this.hasKlaviyoEmbedContent(prerender, formId) || this.hasKlaviyoEmbedContent(slot, formId);

          if (ready) {
            resolve(true);
            return;
          }

          this.triggerKlaviyoScan();

          if (Date.now() >= deadline) {
            resolve(false);
            return;
          }

          window.setTimeout(probe, 250);
        };

        probe();
      });
    }

    pushKlaviyoOpenForm(formId) {
      window._klOnsite = window._klOnsite || [];
      window._klOnsite.push(['openForm', formId]);
    }

    fillAndSubmitKlaviyoEmbed(root, formId, email) {
      const rootLabel = root?.hasAttribute?.('data-klaviyo-prerender')
        ? 'prerender'
        : root?.hasAttribute?.('data-klaviyo-embed-slot')
          ? 'slot'
          : 'unknown';
      const hasContent = this.hasKlaviyoEmbedContent(root, formId);
      const target = this.getKlaviyoEmbedTarget(root, formId);
      const emailInput = target?.querySelector('input[type="email"], input[name="email"]');
      const submitButton = target?.querySelector('button[type="submit"]');

      CartReminderPopup.debugLog('B', 'fillAndSubmitKlaviyoEmbed', 'fill submit attempt', {
        rootLabel,
        formId,
        hasContent,
        hasEmailInput: Boolean(emailInput),
        hasSubmitButton: Boolean(submitButton),
        childCount: target?.childElementCount || 0,
      });

      if (!root || !formId || !hasContent) return false;
      if (!emailInput || !submitButton) return false;

      emailInput.value = email;
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
      submitButton.click();
      return true;
    }

    scheduleKlaviyoOpenFormFallback(formId) {
      CartReminderPopup.debugLog('C', 'scheduleKlaviyoOpenFormFallback', 'openForm fallback', {
        formId,
        hasKlOnsite: Boolean(window._klOnsite),
        cartOpen: this.modal?.classList.contains('is-open'),
      });
      this.triggerKlaviyoScan();
      window.requestAnimationFrame(() => {
        this.pushKlaviyoOpenForm(formId);
      });
    }

    adoptPrerenderedKlaviyoEmbed() {
      const formId = (this.dataset.klaviyoFormId || '').trim();
      if (!formId) return false;

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      if (!slot) return false;

      const slotTarget = slot.querySelector(`.klaviyo-form-${formId}`);
      if (!slotTarget) return false;

      const prerender = this.querySelector('[data-klaviyo-prerender]');
      const sourceTarget = prerender?.querySelector(`.klaviyo-form-${formId}`) || null;

      if (sourceTarget?.childElementCount) {
        while (sourceTarget.firstChild) {
          slotTarget.appendChild(sourceTarget.firstChild);
        }
        this.syncKlaviyoEmbedVisibility();
        return true;
      }

      if (this.hasKlaviyoEmbedContent(slot, formId)) {
        this.syncKlaviyoEmbedVisibility();
        return true;
      }

      return false;
    }

    bindKlaviyoEmbedObserver(slot, formId) {
      const target = this.getKlaviyoEmbedTarget(slot, formId);
      if (!target || slot.dataset.embedObserverBound === 'true') return;

      slot.dataset.embedObserverBound = 'true';
      const observer = new MutationObserver(() => {
        if (this.hasKlaviyoEmbedContent(slot, formId)) {
          this.syncKlaviyoEmbedVisibility();
        }
      });
      observer.observe(target, { childList: true, subtree: true });
    }

    mountKlaviyoEmbed() {
      if (this.dataset.useKlaviyoEmbed !== 'true') return;

      const formId = (this.dataset.klaviyoFormId || '').trim();
      if (!formId) return;

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      if (!slot) return;

      if (slot.dataset.klaviyoEmbedLocked === 'true' && this.hasKlaviyoEmbedContent(slot, formId)) {
        this.bindKlaviyoNativeSubmitTracking(slot);
        this.bindKlaviyoEmbedDismiss();
        CartReminderPopup.debugLog('S', 'mountKlaviyoEmbed', 'skipped remount locked embed', { formId });
        return;
      }

      this.syncKlaviyoEmbedVisibility();
      this.ensureKlaviyoEmbedTarget(slot, formId);
      this.bindKlaviyoEmbedObserver(slot, formId);

      const finalize = async (source, ready) => {
        const formId = (this.dataset.klaviyoFormId || '').trim();
        const prerender = this.querySelector('[data-klaviyo-prerender]');
        const slot = this.querySelector('[data-klaviyo-embed-slot]');
        let cartTotalCents = null;

        try {
          const response = await fetch('/cart.js');
          const cart = await response.json();
          cartTotalCents = cart.total_price ?? null;
        } catch (error) {
          cartTotalCents = null;
        }

        const cartTotalDollars = cartTotalCents != null ? cartTotalCents / 100 : null;

        CartReminderPopup.debugLog('G', 'mountKlaviyoEmbed:finalize', 'embed mount + cart targeting', {
          source,
          ready: Boolean(ready),
          formId,
          prerenderReady: this.hasKlaviyoEmbedContent(prerender, formId),
          slotReady: this.hasKlaviyoEmbedContent(slot, formId),
          hasKlOnsite: Boolean(window._klOnsite),
          cartTotalCents,
          cartTotalDollars,
          klaviyoCartValueMin: 199,
          meetsKlaviyoCartValueRule: cartTotalDollars != null ? cartTotalDollars > 199 : null,
        });
        this.syncKlaviyoEmbedVisibility();
        this.bindKlaviyoNativeSubmitTracking(slot);
        this.bindKlaviyoEmbedDismiss();
      };

      window.requestAnimationFrame(() => {
        this.triggerKlaviyoScan();

        if (this.adoptPrerenderedKlaviyoEmbed()) {
          finalize('adopt-immediate', true);
          return;
        }

        this.waitForKlaviyoEmbed(8000).then((ready) => {
          if (ready) this.adoptPrerenderedKlaviyoEmbed();
          finalize('wait-poll', ready);
        });
      });
    }

    syncKlaviyoEmbedVisibility() {
      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      const fallback = slot?.querySelector('[data-klaviyo-fallback]');
      if (!fallback) return;

      const formId = (this.dataset.klaviyoFormId || '').trim();
      const hasKlaviyoField = this.hasKlaviyoEmbedContent(slot, formId);

      if (hasKlaviyoField) slot.dataset.klaviyoEmbedLocked = 'true';

      const embedActive = hasKlaviyoField || slot.dataset.klaviyoEmbedLocked === 'true';

      CartReminderPopup.debugLog('D', 'syncKlaviyoEmbedVisibility', 'visibility sync', {
        formId,
        hasKlaviyoField,
        embedLocked: slot.dataset.klaviyoEmbedLocked === 'true',
        embedActive,
        fallbackVisible: !embedActive,
      });

      if (embedActive) {
        fallback.classList.remove('is-visible');
        fallback.setAttribute('hidden', '');
        return;
      }

      fallback.classList.add('is-visible');
      fallback.removeAttribute('hidden');
    }

    isKlaviyoFallbackActive() {
      const fallback = this.querySelector('[data-klaviyo-fallback]');
      return Boolean(fallback?.classList.contains('is-visible') && !fallback.hasAttribute('hidden'));
    }

    getEmbedEmailValue() {
      const captured = (this.pendingKlaviyoSubmitEmail || '').trim();
      if (captured) return captured;

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      const inputs = slot?.querySelectorAll('input') || [];

      for (const input of inputs) {
        const value = input.value?.trim() || '';
        if (value && /@/.test(value)) return value;
      }

      return (
        this.getKlaviyoEmbedEmailInput()?.value.trim() ||
        this.querySelector('[data-klaviyo-fallback] input[type="email"]')?.value.trim() ||
        ''
      );
    }

    completeKlaviyoSubmit(formId, reason) {
      CartReminderPopup.debugLog('V', 'completeKlaviyoSubmit', 'submit completed', {
        formId,
        reason,
        hostname: window.location.hostname,
        cartOpen: this.modal?.classList.contains('is-open'),
      });

      this.setSubmitLoading(false);

      if (this.isWelcomePopup()) {
        if (this.modal?.classList.contains('is-open')) {
          this.close(true);
        }
        this.openWelcomeStep2();
        return;
      }

      if (this.modal?.classList.contains('is-open')) {
        this.close(true);
      }

      const SuccessOptIn = window.SuccessOptInPopup || customElements.get('success-opt-in-popup');
      SuccessOptIn?.open?.();
    }

    async handleKlaviyoSubmitTimeout(formId, options = {}) {
      const { sawOnsiteSubscribe = false, clickedAt = 0 } = options;
      const subscribeResult = window.__klaviyoOnsiteSubscribeResult;
      const subscribeAfterClick =
        subscribeResult && (!clickedAt || subscribeResult.at >= clickedAt);
      const subscribeFailed = subscribeAfterClick && !subscribeResult.ok;

      if (subscribeFailed) {
        CartReminderPopup.debugLog('X', 'handleKlaviyoSubmitTimeout', 'subscribe blocked - keep popup open', {
          formId,
          status: subscribeResult.status || 0,
          hostname: window.location.hostname,
        });
        return;
      }

      if (sawOnsiteSubscribe && !subscribeResult?.ok) {
        CartReminderPopup.debugLog('X', 'handleKlaviyoSubmitTimeout', 'onsite request seen but no ok result', {
          formId,
          status: subscribeResult?.status || 0,
          hasResult: Boolean(subscribeResult),
          hostname: window.location.hostname,
        });
        return;
      }

      const email = this.getEmbedEmailValue();
      const companyId = this.getKlaviyoCompanyId();

      CartReminderPopup.debugLog('U', 'handleKlaviyoSubmitTimeout', 'submit timeout fallback', {
        formId,
        hasEmail: Boolean(email),
        hostname: window.location.hostname,
        hasCompanyId: Boolean(companyId),
        hasListId: Boolean(this.getKlaviyoListId()),
      });

      if (email && companyId && this.getKlaviyoListId()) {
        await this.subscribeToKlaviyo(email);
      }

      this.completeKlaviyoSubmit(formId, 'timeout-fallback');
    }

    static startKlaviyoSubmitWatchdog(formId, instance) {
      const clickedAt = Date.now();
      const slot = instance.querySelector('[data-klaviyo-embed-slot]');
      const embed = instance.getKlaviyoEmbedTarget(slot, formId);
      const submitButton = embed?.querySelector('button[type="submit"], button');
      const submitState = { sawOnsiteSubscribe: false, handled: false };

      const tryCompleteFromNetwork = (reason) => {
        if (submitState.handled) return;
        if (CartReminderPopup.lastKlaviyoConversionAt >= clickedAt) return;
        if (!instance.modal?.classList.contains('is-open')) return;

        submitState.handled = true;
        instance.completeKlaviyoSubmit(formId, reason);
      };

      window.setTimeout(() => {
        const embedAfter = instance.getKlaviyoEmbedTarget(slot, formId);
        const buttonAfter = embedAfter?.querySelector('button[type="submit"], button');

        const gotConversion = CartReminderPopup.lastKlaviyoConversionAt >= clickedAt;

        CartReminderPopup.debugLog('R', 'submitWatchdog', 'post-submit status', {
          formId,
          msSinceClick: Date.now() - clickedAt,
          gotConversion,
          sawOnsiteSubscribe: submitState.sawOnsiteSubscribe,
          cartOpen: instance.modal?.classList.contains('is-open'),
          buttonDisabled: Boolean(buttonAfter?.disabled),
          buttonAriaBusy: buttonAfter?.getAttribute('aria-busy') || '',
          embedChildCount: embedAfter?.childElementCount || 0,
          hadButtonAtClick: Boolean(submitButton),
          hostname: window.location.hostname,
        });

        if (gotConversion || submitState.handled) return;

        if (!instance.modal?.classList.contains('is-open')) return;

        const subscribeResult = window.__klaviyoOnsiteSubscribeResult;
        const subscribeOk = Boolean(subscribeResult?.ok && subscribeResult.at >= clickedAt);

        CartReminderPopup.debugLog('W', 'submitWatchdog', 'subscribe result check', {
          formId,
          subscribeOk,
          subscribeStatus: subscribeResult?.status || 0,
          sawOnsiteSubscribe: submitState.sawOnsiteSubscribe,
        });

        if (subscribeOk) {
          tryCompleteFromNetwork('watchdog-subscribe-ok');
          return;
        }

        if (submitState.sawOnsiteSubscribe) {
          CartReminderPopup.debugLog('X', 'submitWatchdog', 'onsite subscribe not ok - skip fallback', {
            formId,
            subscribeStatus: subscribeResult?.status || 0,
            hasResult: Boolean(subscribeResult),
          });
          return;
        }

        instance.handleKlaviyoSubmitTimeout(formId, {
          sawOnsiteSubscribe: submitState.sawOnsiteSubscribe,
          clickedAt,
        });
      }, 12000);

      if (CartReminderPopup.klaviyoNetworkObserver) {
        CartReminderPopup.klaviyoNetworkObserver.disconnect();
        CartReminderPopup.klaviyoNetworkObserver = null;
      }

      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const url = entry.name || '';
            if (!/klaviyo|kmail-lists/i.test(url)) continue;

            CartReminderPopup.debugLog('Q', 'klaviyoNetwork', 'resource timing', {
              url: url.slice(0, 160),
              duration: Math.round(entry.duration),
              transferSize: entry.transferSize,
            });

            if (
              /client\/subscriptions/.test(url) &&
              /onsite=true/.test(url) &&
              entry.duration > 50 &&
              !submitState.sawOnsiteSubscribe
            ) {
              submitState.sawOnsiteSubscribe = true;

              CartReminderPopup.debugLog('V', 'submitWatchdog', 'onsite subscribe request observed', {
                formId,
                duration: Math.round(entry.duration),
              });
            }
          }
        });

        CartReminderPopup.klaviyoNetworkObserver = observer;
        observer.observe({ entryTypes: ['resource'] });

        window.setTimeout(() => {
          observer.disconnect();
          if (CartReminderPopup.klaviyoNetworkObserver === observer) {
            CartReminderPopup.klaviyoNetworkObserver = null;
          }
        }, 15000);
      } catch (error) {
        CartReminderPopup.debugLog('Q', 'klaviyoNetwork', 'observer unavailable', {
          formId,
        });
      }
    }

    bindKlaviyoNativeSubmitTracking(slot) {
      if (!slot) return;

      this.klaviyoSubmitAbort?.abort();
      const controller = new AbortController();
      this.klaviyoSubmitAbort = controller;
      const formId = (this.dataset.klaviyoFormId || '').trim();

      const trackSubmit = (source, control) => {
        this.pendingKlaviyoSubmitEmail = this.getEmbedEmailValue();

        CartReminderPopup.debugLog('O', 'bindKlaviyoNativeSubmitTracking', 'klaviyo submit interaction', {
          source,
          formId,
          embedLocked: slot.dataset.klaviyoEmbedLocked === 'true',
          buttonType: control?.type || '',
          buttonText: control?.textContent?.trim().slice(0, 40) || '',
          capturedEmail: Boolean(this.pendingKlaviyoSubmitEmail),
        });

        CartReminderPopup.startKlaviyoSubmitWatchdog(formId, this);
      };

      slot.addEventListener(
        'click',
        (event) => {
          const path = event.composedPath();
          if (!path.includes(slot)) return;

          const control = path.find((node) => node instanceof HTMLButtonElement);
          if (!control) return;

          const label = control.textContent?.trim().toLowerCase() || '';
          if (label.includes('maybe later')) return;

          trackSubmit('click', control);
        },
        { capture: true, signal: controller.signal }
      );

      slot.addEventListener(
        'submit',
        (event) => {
          if (!event.composedPath().includes(slot)) return;
          trackSubmit('form-submit', event.target);
        },
        { capture: true, signal: controller.signal }
      );

      slot.dataset.nativeSubmitBound = 'true';
    }

    bindKlaviyoEmbedDismiss() {
      if (this.dataset.klaviyoReplacesContent !== 'true') return;

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      if (!slot || slot.dataset.dismissBound === 'true') return;

      slot.dataset.dismissBound = 'true';
      slot.addEventListener('click', (event) => {
        const control = event.target.closest('a, button');
        if (!control || control.type === 'submit') return;

        const label = control.textContent?.trim().toLowerCase() || '';
        if (
          label.includes('maybe later') ||
          label.includes('miss the deal') ||
          label.includes('remind me')
        ) {
          this.close(true);
        }
      });
    }

    getKlaviyoEmbedEmailInput() {
      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      const formId = (this.dataset.klaviyoFormId || '').trim();
      const embedTarget = this.getKlaviyoEmbedTarget(slot, formId);

      return (
        embedTarget?.querySelector(
          'input[type="email"], input[name="email"], input[autocomplete="email"], .klaviyo-form-version-cid input'
        ) ||
        slot?.querySelector('input[type="email"], input[name="email"]') ||
        null
      );
    }

    async submitKlaviyoEmbedForm() {
      const formId = (this.dataset.klaviyoFormId || '').trim();
      const usesFormId = Boolean(formId);

      CartReminderPopup.debugLog('E', 'submitKlaviyoEmbedForm:start', 'submit started', {
        formId,
        fallbackActive: this.isKlaviyoFallbackActive(),
        usesFormId,
      });

      // Welcome uses visible fallback email — don't stall UI waiting for hidden embed (8s+3s).
      const embedWaitMs = this.isWelcomePopup() ? 500 : 8000;
      const embedRetryMs = this.isWelcomePopup() ? 500 : 3000;

      if (this.isKlaviyoFallbackActive()) {
        this.adoptPrerenderedKlaviyoEmbed();

        if (this.isKlaviyoFallbackActive()) {
          const ready = await this.waitForKlaviyoEmbed(embedWaitMs);
          if (ready) this.adoptPrerenderedKlaviyoEmbed();
        }
      }

      if (this.isKlaviyoFallbackActive()) {
        const emailInput = this.querySelector('[data-klaviyo-fallback] input[type="email"]');
        const email = emailInput?.value.trim() || this.pendingKlaviyoSubmitEmail || '';

        if (!this.isValidEmail(email)) {
          emailInput?.focus();
          emailInput?.classList.add('cart-reminder-popup__email-input--error');
          return false;
        }

        emailInput?.classList.remove('cart-reminder-popup__email-input--error');

        if (usesFormId) {
          const prerender = this.querySelector('[data-klaviyo-prerender]');
          const slot = this.querySelector('[data-klaviyo-embed-slot]');

          if (this.fillAndSubmitKlaviyoEmbed(prerender, formId, email)) {
            CartReminderPopup.debugLog('E', 'submitKlaviyoEmbedForm:path', 'prerender submit', { formId });
            this.adoptPrerenderedKlaviyoEmbed();
            return true;
          }

          this.adoptPrerenderedKlaviyoEmbed();
          this.syncKlaviyoEmbedVisibility();

          if (this.fillAndSubmitKlaviyoEmbed(slot, formId, email)) {
            CartReminderPopup.debugLog('E', 'submitKlaviyoEmbedForm:path', 'slot submit', { formId });
            return true;
          }

          this.ensureKlaviyoEmbedTarget(slot, formId);
          this.triggerKlaviyoScan();
          const readyAfterRefresh = await this.waitForKlaviyoEmbed(embedRetryMs);
          if (readyAfterRefresh && this.fillAndSubmitKlaviyoEmbed(slot, formId, email)) {
            CartReminderPopup.debugLog('E', 'submitKlaviyoEmbedForm:path', 'slot submit after refresh', {
              formId,
            });
            return true;
          }

          // Welcome: never openForm (pops Klaviyo native UI). List API only.
          if (this.isWelcomePopup()) {
            CartReminderPopup.debugLog('E', 'submitKlaviyoEmbedForm:path', 'welcome list subscribe', {
              formId,
            });
            await this.subscribeToKlaviyo(email);
            return true;
          }

          CartReminderPopup.debugLog('E', 'submitKlaviyoEmbedForm:path', 'openForm fallback', {
            formId,
            slotReady: this.hasKlaviyoEmbedContent(slot, formId),
          });
          this.scheduleKlaviyoOpenFormFallback(formId);
          return true;
        }

        await this.subscribeToKlaviyo(email);
        return true;
      }

      const emailInput = this.getKlaviyoEmbedEmailInput();
      const email = emailInput?.value.trim() || '';

      if (emailInput && !this.isValidEmail(email)) {
        emailInput.focus();
        emailInput.classList.add('cart-reminder-popup__email-input--error');
        return false;
      }

      if (emailInput) {
        emailInput.classList.remove('cart-reminder-popup__email-input--error');
      }

      const slot = this.querySelector('[data-klaviyo-embed-slot]');
      const embedTarget = this.getKlaviyoEmbedTarget(slot, formId);

      if (email && embedTarget && this.fillAndSubmitKlaviyoEmbed(slot, formId, email)) {
        return true;
      }

      const submitButton = embedTarget?.querySelector('button[type="submit"]');

      if (submitButton) {
        submitButton.click();
        return true;
      }

      if (email && !usesFormId) {
        await this.subscribeToKlaviyo(email);
        return true;
      }

      return false;
    }

    openWelcomeStep2() {
      const WelcomeStep2 = window.WelcomeStep2Popup;
      if (WelcomeStep2?.open) {
        WelcomeStep2.open();
        return;
      }

      const step2 = document.querySelector('welcome-step2-popup');
      step2?.open?.();
    }

    openFromTeaser() {
      if (!this.isWelcomePopup()) return;
      if (this.modal.classList.contains('is-open')) return;
      if (this.isCheckoutPage()) return;
      if (this.isPageExcluded()) return;
      if (this.isProductCodeExcluded()) return;

      window.WelcomeStep2Popup?.hideActiveTeaser?.();
      CartReminderPopup.clearWelcomeAutoShowTimer();
      this.open(false);
    }

    static openWelcomeFromTeaser() {
      const isMobile = window.matchMedia('(max-width: 749px)').matches;
      const target = isMobile ? 'mobile' : 'desktop';
      const instance = [...CartReminderPopup.instances].find(
        (popup) => popup.storageKey === 'welcome-popup' && popup.dataset.deviceTarget === target
      );

      if (!instance) return false;

      instance.openFromTeaser();
      return true;
    }

    /** True when the current PDP handle matches an Admin-excluded product code. */
    static isWelcomeProductCodeExcluded() {
      return [...CartReminderPopup.instances].some(
        (instance) => instance.isWelcomePopup() && instance.isProductCodeExcluded()
      );
    }

    async handleSubmitClick() {
      if (this.isWelcomePopup()) {
        const email =
          this.emailInput?.value.trim() ||
          this.querySelector('[data-klaviyo-fallback] input[type="email"]')?.value.trim() ||
          '';

        if (!this.isValidEmail(email)) {
          this.showEmailError();
          this.syncWelcomeSubmitGate();
          return;
        }

        this.clearEmailError();
        this.pendingKlaviyoSubmitEmail = email;

        // List API only — never openForm/embed (that pops Klaviyo's own "GET MY 10% OFF" UI).
        void this.subscribeToKlaviyo(email).then((result) => {
          CartReminderPopup.debugLog('E', 'handleSubmitClick:welcome', 'welcome list subscribe', {
            result,
            formId: (this.dataset.klaviyoFormId || '').trim(),
          });
        });

        this.close(true);
        this.openWelcomeStep2();
        return;
      }

      if (this.dataset.useKlaviyoEmbed === 'true') {
        this.setSubmitLoading(true);
        const submitted = await this.submitKlaviyoEmbedForm();
        this.setSubmitLoading(false);

        CartReminderPopup.debugLog('E', 'handleSubmitClick', 'submit click result', {
          submitted,
          formId: (this.dataset.klaviyoFormId || '').trim(),
        });

        if (!submitted) return;

        const formId = (this.dataset.klaviyoFormId || '').trim();
        if (formId) return;

        this.close(true);

        const SuccessOptIn = window.SuccessOptInPopup || customElements.get('success-opt-in-popup');
        SuccessOptIn?.open?.();
        return;
      }

      const shouldCollectEmail = this.dataset.showEmailField === 'true';
      const email = this.emailInput?.value.trim() || '';

      if (shouldCollectEmail) {
        if (!this.isValidEmail(email)) {
          this.showEmailError();
          return;
        }

        this.clearEmailError();
        this.setSubmitLoading(true);

        await this.subscribeToKlaviyo(email);

        this.setSubmitLoading(false);
      }

      this.close(true);

      const SuccessOptIn = window.SuccessOptInPopup || customElements.get('success-opt-in-popup');
      SuccessOptIn?.open?.();
    }
  }

  customElements.define('cart-reminder-popup', CartReminderPopup);
  window.CartReminderPopup = CartReminderPopup;

  // ponytail: self-check formatCountdown — fails loudly if HH:MM:SS math breaks
  (function cartReminderCountdownSelfCheck() {
    const cases = [
      [3600000, '01:00:00'],
      [3661000, '01:01:01'],
      [0, '00:00:00'],
      [-1000, '00:00:00'],
    ];
    for (const [ms, expected] of cases) {
      const got = CartReminderPopup.formatCountdown(ms);
      if (got !== expected) {
        console.error('[cart-reminder] countdown self-check failed', { ms, expected, got });
      }
    }
  })();
}
