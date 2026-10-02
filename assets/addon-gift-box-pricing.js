(function initGiftBoxPricing(global) {
  let maxTierUnits = 5;
  let currentMode = 'legacy';

  const variantConfig = {
    defaultVariantId: null,
    byUnits: {},
    byPriceCents: {},
  };

  const configsByMode = {
    legacy: null,
    v2: null,
  };

  function normalizeGiftQty(value) {
    const parsed = parseInt(value, 10);
    if (!parsed || parsed < 1) return 1;
    return parsed;
  }

  function normalizeMode(mode) {
    return mode === 'v2' ? 'v2' : 'legacy';
  }

  function getModeFromItem(item) {
    return normalizeMode(item?.properties?._gift_box_mode);
  }

  function getMaxTierForMode(mode) {
    return normalizeMode(mode) === 'v2' ? 6 : 5;
  }

  function storeModeConfig(mode, config) {
    const normalized = normalizeMode(mode);
    const stored = {
      mode: normalized,
      maxTierUnits: config.maxTierUnits || getMaxTierForMode(normalized),
      defaultVariantId: config.defaultVariantId ?? null,
      byUnits: { ...(config.byUnits || {}) },
      byPriceCents: { ...(config.byPriceCents || {}) },
    };

    configsByMode[normalized] = stored;

    if (!global.GiftBoxTierVariantsByMode) {
      global.GiftBoxTierVariantsByMode = {};
    }
    global.GiftBoxTierVariantsByMode[normalized] = stored;

    return stored;
  }

  function applyMode(mode) {
    const normalized = normalizeMode(mode);
    currentMode = normalized;
    maxTierUnits = getMaxTierForMode(normalized);

    const stored =
      configsByMode[normalized] ||
      global.GiftBoxTierVariantsByMode?.[normalized] ||
      null;

    if (stored) {
      maxTierUnits = stored.maxTierUnits || maxTierUnits;
      variantConfig.defaultVariantId = stored.defaultVariantId ?? null;
      variantConfig.byUnits = { ...(stored.byUnits || {}) };
      variantConfig.byPriceCents = { ...(stored.byPriceCents || {}) };
    }

    return currentMode;
  }

  function getTierUnitPriceCents(units) {
    const qty = normalizeGiftQty(units);
    if (qty <= 1) return 499;
    if (qty === 2) return 899;
    if (qty === 3) return 1199;
    if (qty === 4) return 1499;
    if (qty === 5) return 1799;
    if (maxTierUnits >= 6 && qty >= 6) return 1999;
    return 1799;
  }

  function getTierPriceCents(quantity) {
    const qty = normalizeGiftQty(quantity);
    if (qty <= maxTierUnits) return getTierUnitPriceCents(qty);

    const bundles = Math.floor(qty / maxTierUnits);
    const remainder = qty % maxTierUnits;
    let total = bundles * getTierUnitPriceCents(maxTierUnits);
    if (remainder > 0) total += getTierUnitPriceCents(remainder);
    return total;
  }

  function getTierPriceDollars(quantity) {
    return getTierPriceCents(quantity) / 100;
  }

  function formatTierMoney(quantity) {
    const amount = getTierPriceCents(quantity) / 100;
    const currency = global.Shopify?.currency?.active || 'USD';

    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `$${amount.toFixed(2)}`;
    }
  }

  function formatTierUnitMoney(units) {
    const amount = getTierUnitPriceCents(units) / 100;
    const currency = global.Shopify?.currency?.active || 'USD';

    try {
      return new Intl.NumberFormat(document.documentElement.lang || 'en', {
        style: 'currency',
        currency,
      }).format(amount);
    } catch (error) {
      return `$${amount.toFixed(2)}`;
    }
  }

  function withMode(mode, callback) {
    const previous = currentMode;
    applyMode(mode);
    try {
      return callback();
    } finally {
      applyMode(previous);
    }
  }

  function isGiftBoxCartItem(item) {
    if (!item) return false;
    if (item.properties?._addon_gift_box) return true;
    return Object.entries(item.properties || {}).some(
      ([key, value]) => key === '_addon_gift_box' && value != null && value !== ''
    );
  }

  function isGiftBoxBulkItem(item) {
    if (!isGiftBoxCartItem(item)) return false;
    const flag = item.properties?._gift_box_bulk;
    return flag != null && String(flag).toLowerCase() === 'true';
  }

  function getTierUnitsFromCartItem(item) {
    if (!item) return 1;
    const units = item.properties?._gift_box_units;
    if (units != null && units !== '') return normalizeGiftQty(units);
    return 1;
  }

  function getDisplayUnitsFromCartItem(item) {
    if (!item) return 0;
    return getTierUnitsFromCartItem(item) * normalizeGiftQty(item.quantity);
  }

  function getParentKey(forProductId) {
    return forProductId != null && forProductId !== '' ? String(forProductId) : '';
  }

  function getGiftBoxItemsForParent(cart, forProductId) {
    const parentKey = getParentKey(forProductId);
    const giftItems = (cart?.items || []).filter(isGiftBoxCartItem);

    if (!parentKey) return giftItems;

    return giftItems.filter((item) => {
      const itemKey = item.properties?._addon_for_product_id;
      return itemKey != null && String(itemKey) === parentKey;
    });
  }

  function getTotalUnitsForParent(cart, forProductId) {
    return getGiftBoxItemsForParent(cart, forProductId).reduce(
      (sum, item) => sum + getDisplayUnitsFromCartItem(item),
      0
    );
  }

  function getTotalUnitsFromCart(cart) {
    if (!cart?.items?.length) return 0;
    return cart.items.filter(isGiftBoxCartItem).reduce((sum, item) => sum + getDisplayUnitsFromCartItem(item), 0);
  }

  function decomposeGiftBoxUnits(totalUnits) {
    const safe = normalizeGiftQty(totalUnits);

    if (safe <= maxTierUnits) {
      return [{ tierUnits: safe, cartQuantity: 1, isBulk: false }];
    }

    const bundles = Math.floor(safe / maxTierUnits);
    const remainder = safe % maxTierUnits;
    const lines = [{ tierUnits: maxTierUnits, cartQuantity: bundles, isBulk: true }];

    if (remainder > 0) {
      lines.push({ tierUnits: remainder, cartQuantity: 1, isBulk: false });
    }

    return lines;
  }

  function setVariantConfig(config) {
    if (!config || typeof config !== 'object') return;

    const mode = normalizeMode(config.mode || currentMode);
    const stored = storeModeConfig(mode, {
      maxTierUnits: config.maxTierUnits || getMaxTierForMode(mode),
      defaultVariantId: config.defaultVariantId ?? null,
      byUnits: config.byUnits || {},
      byPriceCents: config.byPriceCents || {},
    });

    applyMode(stored.mode);
  }

  function setModeConfigs(byMode) {
    if (!byMode || typeof byMode !== 'object') return;

    if (byMode.legacy) {
      storeModeConfig('legacy', {
        maxTierUnits: byMode.legacy.maxTierUnits || 5,
        defaultVariantId: byMode.legacy.defaultVariantId ?? null,
        byUnits: byMode.legacy.byUnits || {},
        byPriceCents: byMode.legacy.byPriceCents || {},
      });
    }

    if (byMode.v2) {
      storeModeConfig('v2', {
        maxTierUnits: byMode.v2.maxTierUnits || 6,
        defaultVariantId: byMode.v2.defaultVariantId ?? null,
        byUnits: byMode.v2.byUnits || {},
        byPriceCents: byMode.v2.byPriceCents || {},
      });
    }
  }

  function resolveVariantIdForUnits(units) {
    const qty = normalizeGiftQty(units);
    if (qty > maxTierUnits) return resolveVariantIdForUnits(maxTierUnits);

    if (variantConfig.byUnits[qty]) return variantConfig.byUnits[qty];

    const tierCents = getTierUnitPriceCents(qty);
    if (variantConfig.byPriceCents[tierCents]) return variantConfig.byPriceCents[tierCents];

    return variantConfig.defaultVariantId;
  }

  function markGiftBoxUpsertInflight(active) {
    try {
      if (active) {
        sessionStorage.setItem('gift-box-upsert-inflight', '1');
      } else {
        sessionStorage.removeItem('gift-box-upsert-inflight');
      }
    } catch (error) {
      // ignore storage errors
    }
  }

  function isGiftBoxUpsertInflight() {
    try {
      return sessionStorage.getItem('gift-box-upsert-inflight') === '1';
    } catch (error) {
      return false;
    }
  }

  function notifyGiftBoxCartChange() {
    if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
      publish(PUB_SUB_EVENTS.cartUpdate, { source: 'gift-box-tier' });
    }
  }

  function buildGiftBoxProperties(units, forProductId, isBulk) {
    const properties = {
      _addon_gift_box: 'true',
      _gift_box_units: String(normalizeGiftQty(units)),
      _gift_box_mode: currentMode,
    };

    if (isBulk) {
      properties._gift_box_bulk = 'true';
    }

    if (forProductId != null && forProductId !== '') {
      properties._addon_for_product_id = String(forProductId);
    }

    return properties;
  }

  function removeGiftBoxItemsForParent(cart, forProductId) {
    const giftItems = getGiftBoxItemsForParent(cart, forProductId);
    if (!giftItems.length) return Promise.resolve(cart);

    const updates = {};
    giftItems.forEach((item) => {
      updates[item.key] = 0;
    });

    return fetch('/cart/update.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    }).then((response) => response.json());
  }

  function removeAllGiftBoxItems(cart) {
    return removeGiftBoxItemsForParent(cart, null);
  }

  function addGiftBoxLines(lines, forProductId) {
    const items = lines.map(({ tierUnits, cartQuantity, isBulk }) => {
      const variantId = resolveVariantIdForUnits(tierUnits);
      if (!variantId) {
        throw new Error(`Gift box tier variant is not configured for ${tierUnits} units`);
      }

      return {
        id: variantId,
        quantity: cartQuantity,
        properties: buildGiftBoxProperties(tierUnits, forProductId, isBulk),
      };
    });

    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    }).then((response) => response.json());
  }

  function cartMatchesTarget(cart, totalUnits, forProductId) {
    const giftItems = getGiftBoxItemsForParent(cart, forProductId);
    const targetLines = decomposeGiftBoxUnits(totalUnits);

    if (giftItems.length !== targetLines.length) return false;

    const unmatched = [...giftItems];

    return targetLines.every((target) => {
      const index = unmatched.findIndex((item) => {
        if (getTierUnitsFromCartItem(item) !== target.tierUnits) return false;
        if (normalizeGiftQty(item.quantity) !== target.cartQuantity) return false;
        if (Boolean(isGiftBoxBulkItem(item)) !== Boolean(target.isBulk)) return false;
        if (getModeFromItem(item) !== currentMode) return false;
        return item.variant_id === resolveVariantIdForUnits(target.tierUnits);
      });

      if (index === -1) return false;
      unmatched.splice(index, 1);
      return true;
    });
  }

  function upsertGiftBoxInCart(units, forProductId) {
    const safeUnits = normalizeGiftQty(units);
    const targetLines = decomposeGiftBoxUnits(safeUnits);

    if (targetLines.some(({ tierUnits }) => !resolveVariantIdForUnits(tierUnits))) {
      return Promise.reject(new Error('Gift box tier variant is not configured'));
    }

    markGiftBoxUpsertInflight(true);

    return fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        if (cartMatchesTarget(cart, safeUnits, forProductId)) return cart;

        return removeGiftBoxItemsForParent(cart, forProductId).then(() =>
          addGiftBoxLines(targetLines, forProductId)
        );
      })
      .finally(() => {
        markGiftBoxUpsertInflight(false);
        notifyGiftBoxCartChange();
      });
  }

  function applyModeFromParentCart(cart, forProductId) {
    const giftItems = getGiftBoxItemsForParent(cart, forProductId);
    if (giftItems.length) applyMode(getModeFromItem(giftItems[0]));
  }

  function adjustGiftBoxTotalUnits(delta, forProductId) {
    return fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        applyModeFromParentCart(cart, forProductId);

        const currentTotal = getTotalUnitsForParent(cart, forProductId);
        const nextTotal = currentTotal + delta;

        if (nextTotal < 1) {
          return removeGiftBoxItemsForParent(cart, forProductId).then((updatedCart) => {
            notifyGiftBoxCartChange();
            return updatedCart;
          });
        }

        return upsertGiftBoxInCart(nextTotal, forProductId);
      });
  }

  function upsertGiftBoxFromCartLine(lineIndex, units) {
    return fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        const item = cart.items[normalizeGiftQty(lineIndex) - 1];
        applyMode(getModeFromItem(item));
        const forProductId = item?.properties?._addon_for_product_id;
        return upsertGiftBoxInCart(units, forProductId);
      });
  }

  function adjustGiftBoxFromCartLine(lineIndex, delta) {
    return fetch('/cart.js')
      .then((response) => response.json())
      .then((cart) => {
        const item = cart.items[normalizeGiftQty(lineIndex) - 1];
        applyMode(getModeFromItem(item));
        const forProductId = item?.properties?._addon_for_product_id;
        return adjustGiftBoxTotalUnits(delta, forProductId);
      });
  }

  global.GiftBoxPricing = {
    normalizeGiftQty,
    normalizeMode,
    getDisplayQty: normalizeGiftQty,
    getDisplayUnitsFromCartItem,
    getTierUnitsFromCartItem,
    getTotalUnitsFromCart,
    getTotalUnitsForParent,
    getModeFromItem,
    getCurrentMode() {
      return currentMode;
    },
    getMaxTierUnits() {
      return maxTierUnits;
    },
    applyMode,
    withMode,
    decomposeGiftBoxUnits,
    getTierPriceCents,
    getTierUnitPriceCents,
    getTierTotalCents: getTierPriceCents,
    getTierPriceDollars,
    formatTierMoney,
    formatTierUnitMoney,
    formatMoney(quantity) {
      return formatTierMoney(quantity);
    },
    isGiftBoxCartItem,
    isGiftBoxBulkItem,
    isGiftBoxUpsertInflight,
    setVariantConfig,
    setModeConfigs,
    resolveVariantIdForUnits,
    upsertGiftBoxInCart,
    upsertGiftBoxFromCartLine,
    adjustGiftBoxFromCartLine,
    adjustGiftBoxTotalUnits,
  };

  if (global.GiftBoxTierVariantsByMode) {
    setModeConfigs(global.GiftBoxTierVariantsByMode);
  }

  if (global.GiftBoxTierVariants) {
    setVariantConfig(global.GiftBoxTierVariants);
  }
})(window);
