class CartRemoveButton extends HTMLElement {
  constructor() {
    super();

    this.addEventListener('click', (event) => {
      event.preventDefault();
      const cartItems = this.closest('cart-items') || this.closest('cart-drawer-items');
      cartItems.updateQuantity(this.dataset.index, 0);
    });
  }
}

customElements.define('cart-remove-button', CartRemoveButton);

class CartItems extends HTMLElement {
  constructor() {
    super();
    this.lineItemStatusElement =
      document.getElementById('shopping-cart-line-item-status') || document.getElementById('CartDrawer-LineItemStatus');
    this.quantityRequestSeq = 0;
    this.quantityRequestByLine = new Map();
    this.pendingQuantityByLine = new Map();
    this.appliedQuantityByLine = new Map();
    this.cartChangeInFlight = false;
    this.rateLimitedLineKeys = new Set();

    const debouncedOnChange = debounce((event) => {
      this.onChange(event);
    }, ON_CHANGE_DEBOUNCE_TIMER);

    this.addEventListener('change', debouncedOnChange.bind(this));

    this.addEventListener('click', (event) => {
      const button = event.target.closest('.quantity__button');
      if (!button) return;

      const input = button.closest('quantity-input')?.querySelector('.quantity__input');
      if (!input?.dataset?.index) return;

      const line = input.dataset.index;
      const row = CartItems.getLineRow(line);

      if (row?.getAttribute('data-addon-gift-box') === 'true') {
        if (row.getAttribute('data-gift-box-bulk') === 'true') {
          window.requestAnimationFrame(() => {
            const quantity = parseInt(input.value, 10);
            if (!Number.isFinite(quantity)) return;
            CartItems.applyOptimisticLineTotal(line, quantity);
            this.updateQuantity(
              line,
              quantity,
              input.getAttribute('name'),
              input.dataset.quantityVariantId
            );
          });
          return;
        }

        if (window.GiftBoxPricing?.adjustGiftBoxFromCartLine) {
          const isPlus = button.getAttribute('name') === 'plus';
          const delta = isPlus ? 1 : -1;

          CartItems.resetGiftBoxLineQuantityInput(line);
          this.cartChangeInFlight = true;

          window.GiftBoxPricing.adjustGiftBoxFromCartLine(line, delta)
            .catch((error) => {
              console.error('Gift box tier adjust failed:', error);
              this.updateLiveRegions(line, window.cartStrings.error);
            })
            .finally(() => {
              this.cartChangeInFlight = false;
              this.onCartUpdate();
            });
          return;
        }
      }

      window.requestAnimationFrame(() => {
        const quantity = parseInt(input.value, 10);
        if (!Number.isFinite(quantity)) return;
        CartItems.applyOptimisticLineTotal(line, quantity);
        this.updateQuantity(
          line,
          quantity,
          input.getAttribute('name'),
          input.dataset.quantityVariantId
        );
      });
    });
  }

  cartUpdateUnsubscriber = undefined;

  connectedCallback() {
    this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, (event) => {
      if (event.source === 'cart-items') {
        return;
      }
      this.onCartUpdate();
    });

    this.syncCartAfterPendingGiftBox();
  }

  syncCartAfterPendingGiftBox() {
    const poll = (attempt) => {
      if (!this.isConnected) return;

      const inflight =
        window.GiftBoxPricing?.isGiftBoxUpsertInflight?.() ||
        (() => {
          try {
            return sessionStorage.getItem('gift-box-upsert-inflight') === '1';
          } catch (error) {
            return false;
          }
        })();

      if (attempt === 0 || inflight) {
        this.onCartUpdate();
      }

      if (inflight && attempt < 15) {
        window.setTimeout(() => poll(attempt + 1), 350);
      }
    };

    poll(0);
  }

  disconnectedCallback() {
    if (this.cartUpdateUnsubscriber) {
      this.cartUpdateUnsubscriber();
    }
  }

  resetQuantityInput(id) {
    const input = this.querySelector(`#Quantity-${id}`);
    input.value = input.getAttribute('value');
    this.isEnterPressed = false;
  }

  setValidity(event, index, message) {
    event.target.setCustomValidity(message);
    event.target.reportValidity();
    this.resetQuantityInput(index);
    event.target.select();
  }

  validateQuantity(event) {
    const inputValue = parseInt(event.target.value);
    const index = event.target.dataset.index;
    const row = CartItems.getLineRow(index);

    if (row?.getAttribute('data-addon-gift-box') === 'true' && row?.getAttribute('data-gift-box-bulk') !== 'true') {
      event.target.value = event.target.getAttribute('value') || '1';
      return;
    }

    let message = '';

    if (inputValue < event.target.dataset.min) {
      message = window.quickOrderListStrings.min_error.replace('[min]', event.target.dataset.min);
    } else if (inputValue > parseInt(event.target.max)) {
      message = window.quickOrderListStrings.max_error.replace('[max]', event.target.max);
    } else if (inputValue % parseInt(event.target.step) !== 0) {
      message = window.quickOrderListStrings.step_error.replace('[step]', event.target.step);
    }

    if (message) {
      this.setValidity(event, index, message);
    } else {
      event.target.setCustomValidity('');
      event.target.reportValidity();
      this.updateQuantity(
        index,
        inputValue,
        document.activeElement.getAttribute('name'),
        event.target.dataset.quantityVariantId
      );
    }
  }

  onChange(event) {
    this.validateQuantity(event);
  }

  onCartUpdate() {
    if (this.pendingQuantityByLine.size > 0 || this.cartChangeInFlight) {
      return;
    }

    if (this.tagName === 'CART-DRAWER-ITEMS') {
      fetch(`${routes.cart_url}?section_id=cart-drawer`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const selectors = ['cart-drawer-items', '.cart-drawer__footer'];
          for (const selector of selectors) {
            const targetElement = document.querySelector(selector);
            const sourceElement = html.querySelector(selector);
            if (targetElement && sourceElement) {
              targetElement.replaceWith(sourceElement);
            }
          }
        })
        .catch((e) => {
          console.error(e);
        });
    } else {
      fetch(`${routes.cart_url}?section_id=main-cart-items`)
        .then((response) => response.text())
        .then((responseText) => {
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          const sourceQty = html.querySelector('cart-items');
          this.innerHTML = sourceQty.innerHTML;
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }

  getSectionsToRender() {
    return [
      {
        id: 'main-cart-items',
        section: document.getElementById('main-cart-items').dataset.id,
        selector: '.js-contents',
      },
      {
        id: 'cart-icon-bubble',
        section: 'cart-icon-bubble',
        selector: '.shopify-section',
      },
      {
        id: 'cart-live-region-text',
        section: 'cart-live-region-text',
        selector: '.shopify-section',
      },
      {
        id: 'main-cart-footer',
        section: document.getElementById('main-cart-footer').dataset.id,
        selector: '.js-contents',
      },
    ];
  }

  static formatMoney(cents) {
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

  static parseMoneyToCents(text) {
    if (!text) return null;

    const normalized = String(text).replace(/[^\d.,]/g, '').replace(/,/g, '');
    const amount = parseFloat(normalized);

    if (!Number.isFinite(amount)) return null;

    return Math.round(amount * 100);
  }

  static getLineRow(line) {
    return (
      document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`)
    );
  }

  static getGiftBoxTierUnits(row) {
    const parsed = parseInt(row?.dataset?.giftBoxUnits, 10);
    if (parsed >= 1) return parsed;
    return 1;
  }

  static setGiftBoxTierUnits(row, units) {
    if (!row) return;
    const safeUnits = Math.max(1, parseInt(units, 10) || 1);
    row.dataset.giftBoxUnits = String(safeUnits);
  }

  static resetGiftBoxLineQuantityInput(line) {
    const input =
      document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
    if (!input) return;
    input.value = '1';
    input.setAttribute('value', '1');
  }

  static getLineUnitPriceCents(row) {
    if (!row) return null;

    const finalPrice = row.querySelector('[data-hulkapps-ci-price].cart-item__final-price');
    if (finalPrice) return CartItems.parseMoneyToCents(finalPrice.textContent);

    const candidates = row.querySelectorAll('.cart-item__details [data-hulkapps-ci-price]');
    for (const element of candidates) {
      if (element.tagName === 'S' || element.closest('s')) continue;

      const cents = CartItems.parseMoneyToCents(element.textContent);
      if (cents != null) return cents;
    }

    return null;
  }

  static applyOptimisticLineTotal(line, quantity) {
    const row = CartItems.getLineRow(line);
    if (!row) return;

    const safeQty = Math.max(1, parseInt(quantity, 10) || 1);

    if (row.getAttribute('data-addon-gift-box') === 'true') {
      if (window.GiftBoxPricing) {
        const mode = row.getAttribute('data-gift-box-mode') || 'legacy';
        if (typeof window.GiftBoxPricing.applyMode === 'function') {
          window.GiftBoxPricing.applyMode(mode);
        }

        const tierUnits = CartItems.getGiftBoxTierUnits(row);
        const unitFormatted = window.GiftBoxPricing.formatTierUnitMoney(tierUnits);

        row.querySelectorAll('.cart-item__details [data-gift-box-tier-price]').forEach((element) => {
          element.textContent = unitFormatted;
        });

        if (row.getAttribute('data-gift-box-bulk') === 'true') {
          const lineFormatted = CartItems.formatMoney(window.GiftBoxPricing.getTierUnitPriceCents(tierUnits) * safeQty);
          row.querySelectorAll('[data-hulkapps-line-price], .cart-item__totals [data-gift-box-tier-price]').forEach(
            (element) => {
              if (element.tagName === 'S') return;
              element.textContent = lineFormatted;
            }
          );
          return;
        }

        row.querySelectorAll('[data-gift-box-tier-price]').forEach((element) => {
          element.textContent = unitFormatted;
        });
      }
      CartItems.resetGiftBoxLineQuantityInput(line);
      return;
    }

    const unitCents = CartItems.getLineUnitPriceCents(row);
    if (unitCents == null) return;

    const formattedLine = CartItems.formatMoney(unitCents * safeQty);
    row.querySelectorAll('[data-hulkapps-line-price]').forEach((element) => {
      if (element.tagName === 'S') return;
      element.textContent = formattedLine;
    });
  }

  static syncCartLinePrices(items) {
    if (!Array.isArray(items) || !items.length) return;

    items.forEach((item, index) => {
      const line = index + 1;
      const row =
        document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);

      if (!row || row.getAttribute('data-addon-gift-box') === 'true') return;

      const formattedFinal = CartItems.formatMoney(item.final_line_price);
      const formattedOriginal = CartItems.formatMoney(item.original_line_price);

      row.querySelectorAll('[data-hulkapps-line-price]').forEach((element) => {
        if (element.tagName === 'S') {
          element.textContent = formattedOriginal;
          return;
        }

        element.textContent = formattedFinal;
      });
    });
  }

  static scheduleCartLinePriceSync(items) {
    CartItems.syncCartLinePrices(items);
    window.requestAnimationFrame(() => CartItems.syncCartLinePrices(items));
  }

  getNextPendingLineKey() {
    for (const [lineKey, pending] of this.pendingQuantityByLine) {
      const applied = this.appliedQuantityByLine.get(lineKey);
      if (applied !== pending.quantity) return lineKey;
    }

    return null;
  }

  flushPendingQuantityUpdates() {
    if (this.cartChangeInFlight) return;

    const nextLineKey = this.getNextPendingLineKey();
    if (!nextLineKey) return;

    this.sendQuantityUpdate(nextLineKey);
  }

  updateQuantity(line, quantity, name, variantId) {
    const lineKey = String(line);
    const row = CartItems.getLineRow(line);

    if (
      quantity > 0 &&
      row?.getAttribute('data-addon-gift-box') === 'true' &&
      row?.getAttribute('data-gift-box-bulk') !== 'true' &&
      window.GiftBoxPricing?.upsertGiftBoxFromCartLine
    ) {
      this.pendingQuantityByLine.set(lineKey, { quantity, name, variantId });
      CartItems.applyOptimisticLineTotal(line, quantity);
      this.cartChangeInFlight = true;

      window.GiftBoxPricing.upsertGiftBoxFromCartLine(line, quantity)
        .catch((error) => {
          console.error('Gift box tier swap failed:', error);
          this.updateLiveRegions(line, window.cartStrings.error);
        })
        .finally(() => {
          this.cartChangeInFlight = false;
          this.pendingQuantityByLine.delete(lineKey);
          this.onCartUpdate();
        });

      return;
    }

    this.pendingQuantityByLine.set(lineKey, { quantity, name, variantId });

    CartItems.applyOptimisticLineTotal(line, quantity);

    const hasPendingChanges = this.getNextPendingLineKey();
    if (!hasPendingChanges && !this.cartChangeInFlight) {
      this.pendingQuantityByLine.delete(lineKey);
      return;
    }

    this.flushPendingQuantityUpdates();
  }

  sendQuantityUpdate(line) {
    const lineKey = String(line);
    const pending = this.pendingQuantityByLine.get(lineKey);
    if (!pending) return;

    const { quantity, name, variantId } = pending;
    const requestSeq = ++this.quantityRequestSeq;

    this.quantityRequestByLine.set(lineKey, requestSeq);
    this.cartChangeInFlight = true;

    const body = JSON.stringify({
      line,
      quantity,
      sections: this.getSectionsToRender().map((section) => section.section),
      sections_url: window.location.pathname,
    });

    fetch(`${routes.cart_change_url}`, { ...fetchConfig(), ...{ body } })
      .then((response) => {
        if (response.status === 429) {
          const rateLimitError = new Error('rate_limited');
          rateLimitError.retryAfterMs = 800;
          throw rateLimitError;
        }

        return response.text();
      })
      .then((state) => {
        if (this.quantityRequestByLine.get(lineKey) !== requestSeq) return;

        const latestPending = this.pendingQuantityByLine.get(lineKey);
        if (latestPending && latestPending.quantity !== quantity) return;

        const parsedState = JSON.parse(state);
        const quantityElement =
          document.getElementById(`Quantity-${line}`) || document.getElementById(`Drawer-quantity-${line}`);
        const items = document.querySelectorAll('.cart-item');

        if (parsedState.errors) {
          quantityElement.value = quantityElement.getAttribute('value');
          this.updateLiveRegions(line, parsedState.errors);
          this.pendingQuantityByLine.delete(lineKey);
          return;
        }

        this.classList.toggle('is-empty', parsedState.item_count === 0);
        const cartDrawerWrapper = document.querySelector('cart-drawer');
        const cartFooter = document.getElementById('main-cart-footer');

        if (cartFooter) cartFooter.classList.toggle('is-empty', parsedState.item_count === 0);
        if (cartDrawerWrapper) cartDrawerWrapper.classList.toggle('is-empty', parsedState.item_count === 0);

        this.getSectionsToRender().forEach((section) => {
          const elementToReplace =
            document.getElementById(section.id).querySelector(section.selector) || document.getElementById(section.id);
          elementToReplace.innerHTML = this.getSectionInnerHTML(
            parsedState.sections[section.section],
            section.selector
          );
        });

        this.appliedQuantityByLine.clear();
        parsedState.items.forEach((item, index) => {
          this.appliedQuantityByLine.set(String(index + 1), item.quantity);
        });

        CartItems.scheduleCartLinePriceSync(parsedState.items);

        const updatedValue = parsedState.items[line - 1] ? parsedState.items[line - 1].quantity : undefined;
        const requestedQuantity = parseInt(quantity, 10);
        let message = '';

        if (items.length === parsedState.items.length) {
          if (typeof updatedValue === 'undefined') {
            message = window.cartStrings.error;
          } else if (Number.isFinite(requestedQuantity) && requestedQuantity > updatedValue) {
            message = window.cartStrings.quantityError.replace('[quantity]', updatedValue);
          }
        }
        this.updateLiveRegions(line, message);

        const lineItem =
          document.getElementById(`CartItem-${line}`) || document.getElementById(`CartDrawer-Item-${line}`);
        if (lineItem && lineItem.querySelector(`[name="${name}"]`)) {
          cartDrawerWrapper
            ? trapFocus(cartDrawerWrapper, lineItem.querySelector(`[name="${name}"]`))
            : lineItem.querySelector(`[name="${name}"]`).focus();
        } else if (parsedState.item_count === 0 && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper.querySelector('.drawer__inner-empty'), cartDrawerWrapper.querySelector('a'));
        } else if (document.querySelector('.cart-item') && cartDrawerWrapper) {
          trapFocus(cartDrawerWrapper, document.querySelector('.cart-item__name'));
        }

        publish(PUB_SUB_EVENTS.cartUpdate, { source: 'cart-items', cartData: parsedState, variantId: variantId });
      })
      .catch((error) => {
        if (this.quantityRequestByLine.get(lineKey) !== requestSeq) return;

        if (error?.message === 'rate_limited') {
          this.rateLimitedLineKeys.add(lineKey);
          window.setTimeout(() => {
            this.rateLimitedLineKeys.delete(lineKey);

            if (this.quantityRequestByLine.get(lineKey) !== requestSeq) return;

            this.quantityRequestByLine.delete(lineKey);
            this.cartChangeInFlight = false;

            this.flushPendingQuantityUpdates();
          }, error.retryAfterMs || 800);
          return;
        }

        this.pendingQuantityByLine.delete(lineKey);
        this.cartChangeInFlight = false;
        this.flushPendingQuantityUpdates();
        this.querySelectorAll('.loading__spinner').forEach((overlay) => overlay.classList.add('hidden'));
        const errors = document.getElementById('cart-errors') || document.getElementById('CartDrawer-CartErrors');
        if (errors) errors.textContent = window.cartStrings.error;
      })
      .finally(() => {
        if (this.rateLimitedLineKeys.has(lineKey)) return;
        if (this.quantityRequestByLine.get(lineKey) !== requestSeq) {
          this.cartChangeInFlight = false;
          this.flushPendingQuantityUpdates();
          return;
        }

        this.quantityRequestByLine.delete(lineKey);
        this.cartChangeInFlight = false;

        const latestPending = this.pendingQuantityByLine.get(lineKey);
        if (!latestPending || latestPending.quantity === quantity) {
          this.pendingQuantityByLine.delete(lineKey);
        } else {
          CartItems.applyOptimisticLineTotal(lineKey, latestPending.quantity);
        }

        this.flushPendingQuantityUpdates();
      });
  }

  updateLiveRegions(line, message) {
    const lineItemError =
      document.getElementById(`Line-item-error-${line}`) || document.getElementById(`CartDrawer-LineItemError-${line}`);
    if (lineItemError) lineItemError.querySelector('.cart-item__error-text').textContent = message;

    this.lineItemStatusElement.setAttribute('aria-hidden', true);

    const cartStatus =
      document.getElementById('cart-live-region-text') || document.getElementById('CartDrawer-LiveRegionText');
    cartStatus.setAttribute('aria-hidden', false);

    setTimeout(() => {
      cartStatus.setAttribute('aria-hidden', true);
    }, 1000);
  }

  getSectionInnerHTML(html, selector) {
    return new DOMParser().parseFromString(html, 'text/html').querySelector(selector).innerHTML;
  }

  enableLoading(line) {
    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    [...cartItemElements, ...cartDrawerItemElements].forEach((overlay) => overlay.classList.remove('hidden'));
  }

  disableLoading(line) {
    const cartItemElements = this.querySelectorAll(`#CartItem-${line} .loading__spinner`);
    const cartDrawerItemElements = this.querySelectorAll(`#CartDrawer-Item-${line} .loading__spinner`);

    cartItemElements.forEach((overlay) => overlay.classList.add('hidden'));
    cartDrawerItemElements.forEach((overlay) => overlay.classList.add('hidden'));

    const mainCartItems = document.getElementById('main-cart-items') || document.getElementById('CartDrawer-CartItems');
    mainCartItems?.classList.remove('cart__items--disabled');
  }
}

customElements.define('cart-items', CartItems);

if (!customElements.get('cart-note')) {
  customElements.define(
    'cart-note',
    class CartNote extends HTMLElement {
      constructor() {
        super();

        this.addEventListener(
          'input',
          debounce((event) => {
            const body = JSON.stringify({ note: event.target.value });
            fetch(`${routes.cart_update_url}`, { ...fetchConfig(), ...{ body } });
          }, ON_CHANGE_DEBOUNCE_TIMER)
        );
      }
    }
  );
}
