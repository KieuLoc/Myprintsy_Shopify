(function initCartGiftBox() {
  const pricing = window.GiftBoxPricing;
  if (!pricing) return;

  function hasGiftBoxRows(root) {
    return Boolean((root || document).querySelector('[data-addon-gift-box="true"]'));
  }

  function findGiftBoxRow(node) {
    return node?.closest?.('[data-addon-gift-box="true"]') || null;
  }

  function getRowTierUnits(row) {
    const fromData = parseInt(row?.dataset?.giftBoxUnits, 10);
    if (fromData >= 1) return pricing.normalizeGiftQty(fromData);
    return 1;
  }

  function getRowCartQuantity(row) {
    const input = row?.querySelector('.quantity__input');
    const parsed = parseInt(input?.value, 10);
    if (parsed >= 1) return parsed;
    return 1;
  }

  function applyGiftBoxRowPrices(row) {
    if (!row) return;

    const mode = row.getAttribute('data-gift-box-mode') || 'legacy';
    if (typeof pricing.applyMode === 'function') {
      pricing.applyMode(mode);
    }

    const tierUnits = getRowTierUnits(row);
    const unitFormatted = pricing.formatTierUnitMoney(tierUnits);

    row.querySelectorAll('.cart-item__details [data-gift-box-tier-price]').forEach((element) => {
      element.textContent = unitFormatted;
    });

    if (row.getAttribute('data-gift-box-bulk') === 'true') {
      const cartQty = getRowCartQuantity(row);
      const lineCents = pricing.getTierUnitPriceCents(tierUnits) * cartQty;
      const amount = lineCents / 100;
      const currency = window.Shopify?.currency?.active || 'USD';
      let lineFormatted = `$${amount.toFixed(2)}`;

      try {
        lineFormatted = new Intl.NumberFormat(document.documentElement.lang || 'en', {
          style: 'currency',
          currency,
        }).format(amount);
      } catch (error) {
        // keep fallback
      }

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

  function applyAllGiftBoxPrices(root) {
    if (!hasGiftBoxRows(root)) return;
    (root || document).querySelectorAll('[data-addon-gift-box="true"]').forEach(applyGiftBoxRowPrices);
    syncSubtotalWithGiftBox();
  }

  let subtotalText = '';

  function formatCartMoney(cents) {
    const amount = Number(cents || 0) / 100;
    const currency = window.Shopify?.currency?.active || 'USD';
    let formatted = `$${amount.toFixed(2)}`;

    try {
      formatted = new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      // keep fallback
    }

    if (currency === 'USD' && !/USD/i.test(formatted)) formatted = `${formatted} USD`;
    return formatted;
  }

  function syncSubtotalWithGiftBox() {
    fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        const giftItems = (cart.items || []).filter((item) => pricing.isGiftBoxCartItem(item));
        if (!giftItems.length) return;

        const shopifyGiftCents = giftItems.reduce((sum, item) => sum + (item.final_line_price || 0), 0);
        const displayGiftCents = giftItems.reduce((sum, item) => {
          const units = pricing.getDisplayUnitsFromCartItem(item);
          const mode = pricing.getModeFromItem(item);
          const cents =
            typeof pricing.withMode === 'function'
              ? pricing.withMode(mode, () => pricing.getTierPriceCents(units))
              : pricing.getTierPriceCents(units);
          return sum + cents;
        }, 0);

        const totalCents = (cart.total_price || 0) - shopifyGiftCents + displayGiftCents;
        subtotalText = formatCartMoney(totalCents);

        document.querySelectorAll('[data-hulkapps-cart-total]').forEach((element) => {
          if (element.textContent.trim() === subtotalText) return;
          element.textContent = subtotalText;
        });
      })
      .catch(() => {});
  }

  function watchSubtotal() {
    if (window.__myprintsyGiftBoxSubtotalWatch) return;
    window.__myprintsyGiftBoxSubtotalWatch = true;

    const observer = new MutationObserver(() => {
      const drifted = Array.from(document.querySelectorAll('[data-hulkapps-cart-total]')).some(
        (element) => subtotalText && element.textContent.trim() !== subtotalText
      );
      if (drifted) syncSubtotalWithGiftBox();
    });

    document.querySelectorAll('[data-hulkapps-cart-total]').forEach((element) => {
      observer.observe(element, { childList: true, characterData: true, subtree: true });
    });
  }

  function scheduleLinePriceRefresh() {
    window.requestAnimationFrame(() => applyAllGiftBoxPrices());
  }

  function bindEvents() {
    document.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('.quantity__button');
        if (!button) return;

        const row = findGiftBoxRow(button);
        if (!row) return;

        window.requestAnimationFrame(() => applyGiftBoxRowPrices(row));
      },
      true
    );

    document.addEventListener(
      'change',
      (event) => {
        if (!event.target.matches('.quantity__input')) return;

        const row = findGiftBoxRow(event.target);
        if (!row) return;

        applyGiftBoxRowPrices(row);
      },
      true
    );

    if (typeof subscribe === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      subscribe(PUB_SUB_EVENTS.cartUpdate, () => {
        scheduleLinePriceRefresh();
      });
    }
  }

  function init() {
    syncSubtotalWithGiftBox();
    watchSubtotal();
    if (!hasGiftBoxRows()) return;

    applyAllGiftBoxPrices();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
