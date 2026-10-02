/** Chỉ dùng với template sản phẩm produc-pack-011926 — giá hiển thị theo bảng size × loại áo (EUR). */
const PACK_TEMPLATE_SUFFIX = 'produc-pack-011926';
const PACK_SIZE_PRICE_TABLE = {
  'CLASSIC TEE': {
    S: 24.95,
    M: 26.95,
    L: 26.95,
    XL: 26.95,
    '2XL': 28.95,
    '3XL': 28.95,
    '4XL': 28.95,
    '5XL': 29.95,
  },
  SWEATER: {
    S: 32.95,
    M: 34.95,
    L: 34.95,
    XL: 36.95,
    '2XL': 36.95,
    '3XL': 28.95,
    '4XL': 39.95,
    '5XL': 39.95,
  },
  HOODIE: {
    S: 44.95,
    M: 44.95,
    L: 44.95,
    XL: 44.95,
    '2XL': 44.95,
    '3XL': 46.95,
    '4XL': 47.95,
    '5XL': 47.95,
  },
};
const PACK_DISCOUNT_BY_COUNT = {
  1: 0,
  2: 0.1,
  3: 0.15,
  4: 0.2,
  5: 0.25,
};

function mapVariantValueToGarmentCategory(value) {
  if (!value) return null;
  const v = String(value).toLowerCase().trim();
  if (v.includes('hoodie')) return 'HOODIE';
  if (v.includes('sweater')) return 'SWEATER';
  if (v.includes('classic') && v.includes('tee')) return 'CLASSIC TEE';
  if (v.includes('classic tee')) return 'CLASSIC TEE';
  if ((v.includes('tee') || v.includes('t-shirt') || v.includes('tshirt')) && !v.includes('hoodie')) return 'CLASSIC TEE';
  return null;
}

function getVariantOptionSelections(variantSelects) {
  const rows = [];
  if (!variantSelects) return rows;

  variantSelects.querySelectorAll('fieldset').forEach((fs) => {
    const legend = fs.querySelector('legend');
    const name = legend?.textContent?.replace(/:\s*$/, '').trim() || '';
    const checked = fs.querySelector('input[type="radio"]:checked');
    if (checked?.value) rows.push({ name, value: checked.value });
  });

  variantSelects.querySelectorAll('select[name^="options"]').forEach((sel) => {
    const id = sel.id;
    const label = id ? variantSelects.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const name = label?.textContent?.trim() || '';
    if (sel.value) rows.push({ name, value: sel.value });
  });

  return rows;
}

function isPackOptionRow({ name, value }) {
  const n = name.toLowerCase();
  const val = String(value).toLowerCase();
  if (n.includes('pack') || n.includes('buy more')) return true;
  if (/^pack\s*\d+/.test(val) || val.includes('pack') && /\d/.test(val)) return true;
  return false;
}

function resolveGarmentCategoryFromVariantSelects(variantSelects) {
  const rows = getVariantOptionSelections(variantSelects);
  for (const row of rows) {
    if (isPackOptionRow(row)) continue;
    const cat = mapVariantValueToGarmentCategory(row.value);
    if (cat) return cat;
  }
  return null;
}

function extractPackCountFromValue(packValue) {
  if (!packValue) return 0;
  const m = String(packValue).match(/(\d+)/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 5 ? n : 0;
}

function getPackValueFromVariantDom(variantSelects) {
  if (!variantSelects) return null;
  const fieldsets = variantSelects.querySelectorAll('fieldset');
  for (const fs of fieldsets) {
    const legend = fs.querySelector('legend');
    if (!legend) continue;
    const name = legend.textContent.trim().toLowerCase();
    if (!name.includes('pack') && !name.includes('buy more')) continue;
    const checked = fs.querySelector('input[type="radio"]:checked');
    if (checked?.value) return checked.value;
  }
  const selects = variantSelects.querySelectorAll('select[name^="options"]');
  for (const sel of selects) {
    const id = sel.id;
    const label = id ? variantSelects.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    const labelText = (label?.textContent || '').toLowerCase();
    if (!labelText.includes('pack') && !labelText.includes('buy more')) continue;
    if (sel.value) return sel.value;
  }
  return null;
}

function formatNumericForPriceString(baseText, numericTotal) {
  const numericPart = baseText.replace(/[^0-9.,]/g, '');
  if (!numericPart) return baseText;
  const usesCommaDecimal = /,\d{1,2}(?!\d)/.test(numericPart) && !/\.\d{1,2}/.test(numericPart);
  let out = Number(numericTotal).toFixed(2);
  if (usesCommaDecimal) out = out.replace('.', ',');
  return baseText.replace(numericPart, out);
}

/** True when the changed control is a Pack / Buy more option. */
function isPackOptionTarget(target) {
  if (!target || target.nodeType !== 1) return false;

  const fieldset = target.closest?.('fieldset');
  if (fieldset) {
    const legend = (fieldset.querySelector('legend')?.textContent || '').toLowerCase();
    if (legend.includes('pack') || legend.includes('buy more')) return true;
  }

  const inputWrap = target.closest?.('.product-form__input');
  const wrapLabel = (inputWrap?.querySelector('legend, label')?.textContent || '').toLowerCase();
  if (wrapLabel.includes('pack') || wrapLabel.includes('buy more')) return true;

  const value = String(target.value || target.textContent || '').toLowerCase();
  if (/^pack\s*\d+/.test(value) || (value.includes('pack') && /\d/.test(value))) return true;

  const nameAttr = String(target.name || target.getAttribute?.('name') || '').toLowerCase();
  return nameAttr.includes('pack') || nameAttr.includes('buy more');
}

/** Template "No Customily": options stay, gallery is fixed Shopify media. */
function isNoCustomilyPreviewTemplate() {
  const el = document.querySelector('product-info[data-product-template-suffix]');
  return el?.getAttribute('data-product-template-suffix') === 'no-customily';
}

/**
 * True only when Customily mounted a real preview UI on this PDP.
 * Do NOT treat CDN <script> / window.Customily as a host — those load on every
 * product page via theme.liquid and would wrongly skip Dawn gallery Pack sync.
 * no-customily template: always allow Dawn media updates (static Shopify photos).
 */
function hasCustomilyPreviewHost() {
  if (isNoCustomilyPreviewTemplate()) return false;
  return !!document.querySelector(
    [
      '.cl-product',
      'iframe[src*="customily"]',
      '#customily-cart-btn',
      '.customily-preview-button',
      '[id*="customily"]',
      '[class*="customily"]',
    ].join(', ')
  );
}

/** Session cache for section HTML — Pack 1→2→1 skips a second network round-trip. */
const PRODUCT_SECTION_HTML_CACHE = new Map();
const PRODUCT_SECTION_HTML_CACHE_MAX = 16;
const PRODUCT_SECTION_IMG_RE = /https?:\/\/[^"'\\\s>]+\.(?:webp|png|jpe?g|gif)(?:\?[^"'\\\s>]*)?/gi;

function rememberSectionHtml(url, text) {
  if (!url || typeof text !== 'string') return;
  if (PRODUCT_SECTION_HTML_CACHE.has(url)) PRODUCT_SECTION_HTML_CACHE.delete(url);
  PRODUCT_SECTION_HTML_CACHE.set(url, text);
  while (PRODUCT_SECTION_HTML_CACHE.size > PRODUCT_SECTION_HTML_CACHE_MAX) {
    const oldest = PRODUCT_SECTION_HTML_CACHE.keys().next().value;
    PRODUCT_SECTION_HTML_CACHE.delete(oldest);
  }
}

function warmImagesFromSectionHtml(text) {
  if (!text || typeof text !== 'string') return;
  const matches = text.match(PRODUCT_SECTION_IMG_RE);
  if (!matches) return;
  const limit = Math.min(matches.length, 12);
  for (let i = 0; i < limit; i++) {
    const img = new Image();
    img.decoding = 'async';
    img.src = matches[i];
  }
}

function findPackFieldset(variantSelects) {
  if (!variantSelects) return null;
  return (
    Array.from(variantSelects.querySelectorAll('fieldset')).find((fs) => {
      const legend = (fs.querySelector('legend')?.textContent || '').toLowerCase();
      return legend.includes('pack') || legend.includes('buy more');
    }) || null
  );
}

/**
 * Idle-prefetch Shopify section HTML for each Pack option (after page load).
 * Does not block LCP; speeds Pack clicks that hit PRODUCT_SECTION_HTML_CACHE.
 */
function scheduleIdlePackSectionPrefetch(productInfo) {
  if (!productInfo || productInfo.dataset.packPrefetchScheduled === '1') return;
  productInfo.dataset.packPrefetchScheduled = '1';

  let started = false;
  const start = () => {
    if (started) return;
    started = true;

    const run = () => {
      const variantSelects = productInfo.querySelector('variant-selects');
      const packFieldset = findPackFieldset(variantSelects);
      if (!packFieldset) return;

      const packInputs = Array.from(
        packFieldset.querySelectorAll('input[type="radio"][data-option-value-id]')
      );
      if (packInputs.length < 2) return;

      const productUrl = productInfo.dataset.url;
      const sectionId = productInfo.dataset.originalSection || productInfo.dataset.section;
      if (!productUrl || !sectionId) return;

      const urls = [];
      for (const packInput of packInputs) {
        const optionValues = Array.from(
          variantSelects.querySelectorAll('select option[selected], fieldset input:checked')
        ).map((el) => {
          if (el.closest('fieldset') === packFieldset) return packInput.dataset.optionValueId;
          return el.dataset.optionValueId;
        });
        if (!optionValues.length || optionValues.some((id) => !id)) continue;
        urls.push(`${productUrl}?section_id=${sectionId}&option_values=${optionValues.join(',')}`);
      }

      let i = 0;
      const next = () => {
        if (i >= urls.length) return;
        const url = urls[i++];
        const fetchOne = () => {
          if (PRODUCT_SECTION_HTML_CACHE.has(url)) {
            next();
            return;
          }
          fetch(url)
            .then((res) => res.text())
            .then((text) => {
              rememberSectionHtml(url, text);
              warmImagesFromSectionHtml(text);
            })
            .catch(() => {})
            .finally(() => {
              if ('requestIdleCallback' in window) {
                requestIdleCallback(next, { timeout: 2000 });
              } else {
                setTimeout(next, 120);
              }
            });
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(fetchOne, { timeout: 2000 });
        } else {
          setTimeout(fetchOne, 80);
        }
      };
      next();
    };

    // Let Customily first paint / GetProduct win bandwidth, then prefetch.
    window.setTimeout(run, 1600);
  };

  const afterLoad = () => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(start, { timeout: 4500 });
    } else {
      window.setTimeout(start, 2200);
    }
  };

  if (document.readyState === 'complete') afterLoad();
  else window.addEventListener('load', afterLoad, { once: true });

  document.addEventListener(
    'customily-app-will-load',
    () => {
      window.setTimeout(start, 900);
    },
    { once: true }
  );
}

if (!customElements.get('product-info')) {
  customElements.define(
    'product-info',
    class ProductInfo extends HTMLElement {
      quantityInput = undefined;
      quantityForm = undefined;
      onVariantChangeUnsubscriber = undefined;
      cartUpdateUnsubscriber = undefined;
      packPricingQuantityUnsubscriber = undefined;
      packPricingBoundOnChange = undefined;
      abortController = undefined;
      pendingRequestUrl = null;
      lastPackOptionChange = false;
      preProcessHtmlCallbacks = [];
      postProcessHtmlCallbacks = [];

      constructor() {
        super();

        this.quantityInput = this.querySelector('.quantity__input');
      }

      connectedCallback() {
        this.initializeProductSwapUtility();

        this.onVariantChangeUnsubscriber = subscribe(
          PUB_SUB_EVENTS.optionValueSelectionChange,
          this.handleOptionValueChange.bind(this)
        );

        if (this.dataset.productTemplateSuffix === PACK_TEMPLATE_SUFFIX) {
          this.packPricingBoundOnChange = (e) => {
            if (e.target?.classList?.contains('pack-size-select')) this.updatePackPrice();
          };
          this.addEventListener('change', this.packPricingBoundOnChange);
          this.packPricingQuantityUnsubscriber = subscribe(PUB_SUB_EVENTS.quantityUpdate, () => this.updatePackPrice());
        }

        this.initQuantityHandlers();
        this.dispatchEvent(new CustomEvent('product-info:loaded', { bubbles: true }));
        scheduleIdlePackSectionPrefetch(this);
      }

      addPreProcessCallback(callback) {
        this.preProcessHtmlCallbacks.push(callback);
      }

      initQuantityHandlers() {
        if (!this.quantityInput) return;

        this.quantityForm = this.querySelector('.product-form__quantity');
        if (!this.quantityForm) return;

        this.setQuantityBoundries();
        if (!this.dataset.originalSection) {
          this.cartUpdateUnsubscriber = subscribe(PUB_SUB_EVENTS.cartUpdate, this.fetchQuantityRules.bind(this));
        }
      }

      disconnectedCallback() {
        this.onVariantChangeUnsubscriber();
        this.cartUpdateUnsubscriber?.();
        this.packPricingQuantityUnsubscriber?.();
        if (this.packPricingBoundOnChange) {
          this.removeEventListener('change', this.packPricingBoundOnChange);
        }
      }

      initializeProductSwapUtility() {
        this.preProcessHtmlCallbacks.push((html) =>
          html.querySelectorAll('.scroll-trigger').forEach((element) => element.classList.add('scroll-trigger--cancel'))
        );
        this.postProcessHtmlCallbacks.push((newNode) => {
          window?.Shopify?.PaymentButton?.init();
          window?.ProductModel?.loadShopifyXR();
        });
      }

      handleOptionValueChange({ data: { event, target, selectedOptionValues } }) {
        if (!this.contains(event.target)) return;

        this.resetProductFormState();
        this.lastPackOptionChange = isPackOptionTarget(target);

        const productUrl = target.dataset.productUrl || this.pendingRequestUrl || this.dataset.url;
        this.pendingRequestUrl = productUrl;
        const shouldSwapProduct = this.dataset.url !== productUrl;
        const shouldFetchFullPage = this.dataset.updateUrl === 'true' && shouldSwapProduct;

        this.renderProductInfo({
          requestUrl: this.buildRequestUrlWithParams(productUrl, selectedOptionValues, shouldFetchFullPage),
          targetId: target.id,
          callback: shouldSwapProduct
            ? this.handleSwapProduct(productUrl, shouldFetchFullPage)
            : this.handleUpdateProductInfo(productUrl),
        });
      }

      resetProductFormState() {
        const productForm = this.productForm;
        productForm?.toggleSubmitButton(true);
        productForm?.handleErrorMessage();
      }

      handleSwapProduct(productUrl, updateFullPage) {
        return (html) => {
          this.productModal?.remove();

          const selector = updateFullPage ? "product-info[id^='MainProduct']" : 'product-info';
          const variant = this.getSelectedVariant(html.querySelector(selector));
          this.updateURL(productUrl, variant?.id);

          if (updateFullPage) {
            document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;

            HTMLUpdateUtility.viewTransition(
              document.querySelector('main'),
              html.querySelector('main'),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          } else {
            HTMLUpdateUtility.viewTransition(
              this,
              html.querySelector('product-info'),
              this.preProcessHtmlCallbacks,
              this.postProcessHtmlCallbacks
            );
          }
        };
      }

      renderProductInfo({ requestUrl, targetId, callback }) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        const applyHtml = (responseText) => {
          this.pendingRequestUrl = null;
          const html = new DOMParser().parseFromString(responseText, 'text/html');
          // Pause theme observers during DOM swap (Size/Option/Pack feel “stuck”).
          window.__myprintsyPdpUpdating = true;
          try {
            callback(html);
          } finally {
            window.setTimeout(function () {
              window.__myprintsyPdpUpdating = false;
            }, 50);
          }
          // Don't steal focus back onto radios — fights Pack clicks + opens autofill.
        };

        const cached = PRODUCT_SECTION_HTML_CACHE.get(requestUrl);
        if (cached) {
          applyHtml(cached);
          return;
        }

        fetch(requestUrl, { signal: this.abortController.signal })
          .then((response) => response.text())
          .then((responseText) => {
            rememberSectionHtml(requestUrl, responseText);
            applyHtml(responseText);
          })
          .catch((error) => {
            if (error.name === 'AbortError') {
              console.log('Fetch aborted by user');
            } else {
              console.error(error);
            }
          });
      }

      getSelectedVariant(productInfoNode) {
        const selectedVariant = productInfoNode.querySelector('variant-selects [data-selected-variant]')?.innerHTML;
        return !!selectedVariant ? JSON.parse(selectedVariant) : null;
      }

      updatePackPrice() {
        if (this.dataset.productTemplateSuffix !== PACK_TEMPLATE_SUFFIX) return;

        const priceContainer = this.querySelector(`#price-${this.dataset.section}`);
        if (!priceContainer) return;

        const variantSelects = this.variantSelectors;
        if (!variantSelects) return;

        this.updatePackPriceFromSizeTable(priceContainer, variantSelects);
      }

      updatePackPriceFromSizeTable(priceContainer, variantSelects) {
        const category = resolveGarmentCategoryFromVariantSelects(variantSelects);
        const packValue =
          getPackValueFromVariantDom(variantSelects) ||
          (() => {
            const rows = getVariantOptionSelections(variantSelects);
            for (const row of rows) {
              if (isPackOptionRow(row)) return row.value;
            }
            return null;
          })();

        const packCount = extractPackCountFromValue(packValue);
        const priceRows = priceContainer.querySelectorAll('.price-item--regular, .price-item--sale');

        const restoreBase = () => {
          priceRows.forEach((el) => {
            if (el.closest('small.unit-price') || el.closest('s')) return;
            if (el.dataset.basePrice) el.innerText = el.dataset.basePrice;
          });
        };

        if (!category || !packCount || !PACK_SIZE_PRICE_TABLE[category]) {
          restoreBase();
          return;
        }

        const sectionId = this.dataset.section;
        let perPackSum = 0;
        for (let i = 1; i <= packCount; i++) {
          const sel = document.getElementById(`pack-size-${sectionId}-${i}`);
          if (!sel) {
            restoreBase();
            return;
          }
          const selectedSize = sel.value || 'S';
          const unit = PACK_SIZE_PRICE_TABLE[category][selectedSize];
          if (unit == null) {
            restoreBase();
            return;
          }
          perPackSum += unit;
        }

        let qty = parseInt(this.quantityInput?.value, 10);
        if (Number.isNaN(qty) || qty < 1) qty = 1;
        const discountRate = PACK_DISCOUNT_BY_COUNT[packCount] ?? 0;
        const discountedPerPack = perPackSum * (1 - discountRate);
        const total = discountedPerPack * qty;

        priceRows.forEach((el) => {
          if (el.closest('small.unit-price') || el.closest('s')) return;

          const baseText = el.dataset.basePrice || el.innerText.trim();
          if (!el.dataset.basePrice) {
            el.dataset.basePrice = baseText;
          }

          el.innerText = formatNumericForPriceString(baseText, total);
        });
      }

      buildRequestUrlWithParams(url, optionValues, shouldFetchFullPage = false) {
        const params = [];

        !shouldFetchFullPage && params.push(`section_id=${this.sectionId}`);

        if (optionValues.length) {
          params.push(`option_values=${optionValues.join(',')}`);
        }

        return `${url}?${params.join('&')}`;
      }

      updateOptionValues(html) {
        const variantSelects = html.querySelector('variant-selects');
        const current = this.variantSelectors;
        if (!variantSelects || !current) return;

        HTMLUpdateUtility.viewTransition(current, variantSelects, this.preProcessHtmlCallbacks);

        // Dawn keeps the old node ~500ms. Duplicate radios share the same `name`
        // across hidden+visible trees → Pack / Size clicks stop registering with Customily.
        this.querySelectorAll('variant-selects').forEach((el) => {
          if (el !== this.variantSelectors) el.remove();
        });
      }

      handleUpdateProductInfo(productUrl) {
        return (html) => {
          const variant = this.getSelectedVariant(html);

          this.pickupAvailability?.update(variant);
          this.updateOptionValues(html);
          this.updateURL(productUrl, variant?.id);
          this.updateVariantInputs(variant?.id);

          if (!variant) {
            this.setUnavailable();
            return;
          }

          // Customily owns live preview on personalized PDPs — Dawn media rebuild on every
          // Size/Option/Pack click janks the main thread. Keep price + variant id updates.
          if (!hasCustomilyPreviewHost()) {
            this.updateMedia(html, variant?.featured_media?.id);
          }

          const updateSourceFromDestination = (id, shouldHide = (source) => false) => {
            const source = html.getElementById(`${id}-${this.sectionId}`);
            const destination = this.querySelector(`#${id}-${this.dataset.section}`);
            if (source && destination) {
              destination.innerHTML = source.innerHTML;
              destination.classList.toggle('hidden', shouldHide(source));
            }
          };

          updateSourceFromDestination('price');
          this.updatePackPrice();
          updateSourceFromDestination('Sku', ({ classList }) => classList.contains('hidden'));
          updateSourceFromDestination('Inventory', ({ innerText }) => innerText === '');
          updateSourceFromDestination('Volume');
          updateSourceFromDestination('Price-Per-Item', ({ classList }) => classList.contains('hidden'));

          this.updateQuantityRules(this.sectionId, html);
          this.querySelector(`#Quantity-Rules-${this.dataset.section}`)?.classList.remove('hidden');
          this.querySelector(`#Volume-Note-${this.dataset.section}`)?.classList.remove('hidden');

          this.productForm?.toggleSubmitButton(
            html.getElementById(`ProductSubmitButton-${this.sectionId}`)?.hasAttribute('disabled') ?? true,
            window.variantStrings.soldOut
          );

          publish(PUB_SUB_EVENTS.variantChange, {
            data: {
              sectionId: this.sectionId,
              html,
              variant,
            },
          });
        };
      }

      updateVariantInputs(variantId) {
        this.querySelectorAll(
          `#product-form-${this.dataset.section}, #product-form-installment-${this.dataset.section}`
        ).forEach((productForm) => {
          const input = productForm.querySelector('input[name="id"]');
          input.value = variantId ?? '';
          input.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }

      updateURL(url, variantId) {
        this.querySelector('share-button')?.updateUrl(
          `${window.shopUrl}${url}${variantId ? `?variant=${variantId}` : ''}`
        );

        if (this.dataset.updateUrl === 'false') return;
        window.history.replaceState({}, '', `${url}${variantId ? `?variant=${variantId}` : ''}`);
      }

      setUnavailable() {
        this.productForm?.toggleSubmitButton(true, window.variantStrings.unavailable);

        const selectors = ['price', 'Inventory', 'Sku', 'Price-Per-Item', 'Volume-Note', 'Volume', 'Quantity-Rules']
          .map((id) => `#${id}-${this.dataset.section}`)
          .join(', ');
        document.querySelectorAll(selectors).forEach(({ classList }) => classList.add('hidden'));
      }

      updateMedia(html, variantFeaturedMediaId) {
        if (!variantFeaturedMediaId) return;

        const mediaGallery = this.querySelector('media-gallery');
        const currentActiveId = mediaGallery
          ?.querySelector?.('.product__media-item.is-active, li.is-active, [aria-current="true"]')
          ?.dataset?.mediaId;
        const nextMediaId = `${this.dataset.section}-${variantFeaturedMediaId}`;

        // Same featured image already showing — only ensure active state, skip list rebuild + modal rewrite.
        if (currentActiveId === nextMediaId) {
          mediaGallery?.setActiveMedia?.(nextMediaId, true);
          return;
        }

        const mediaGallerySource = this.querySelector('media-gallery ul');
        const mediaGalleryDestination = html.querySelector(`media-gallery ul`);

        const refreshSourceData = () => {
          if (this.hasAttribute('data-zoom-on-hover')) enableZoomOnHover(2);
          const mediaGallerySourceItems = Array.from(mediaGallerySource.querySelectorAll('li[data-media-id]'));
          const sourceSet = new Set(mediaGallerySourceItems.map((item) => item.dataset.mediaId));
          const sourceMap = new Map(
            mediaGallerySourceItems.map((item, index) => [item.dataset.mediaId, { item, index }])
          );
          return [mediaGallerySourceItems, sourceSet, sourceMap];
        };

        if (mediaGallerySource && mediaGalleryDestination) {
          let [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
          const mediaGalleryDestinationItems = Array.from(
            mediaGalleryDestination.querySelectorAll('li[data-media-id]')
          );
          const destinationSet = new Set(mediaGalleryDestinationItems.map(({ dataset }) => dataset.mediaId));
          let shouldRefresh = false;

          // add items from new data not present in DOM
          for (let i = mediaGalleryDestinationItems.length - 1; i >= 0; i--) {
            if (!sourceSet.has(mediaGalleryDestinationItems[i].dataset.mediaId)) {
              mediaGallerySource.prepend(mediaGalleryDestinationItems[i]);
              shouldRefresh = true;
            }
          }

          // remove items from DOM not present in new data
          for (let i = 0; i < mediaGallerySourceItems.length; i++) {
            if (!destinationSet.has(mediaGallerySourceItems[i].dataset.mediaId)) {
              mediaGallerySourceItems[i].remove();
              shouldRefresh = true;
            }
          }

          // refresh
          if (shouldRefresh) [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();

          // if media galleries don't match, sort to match new data order
          mediaGalleryDestinationItems.forEach((destinationItem, destinationIndex) => {
            const sourceData = sourceMap.get(destinationItem.dataset.mediaId);

            if (sourceData && sourceData.index !== destinationIndex) {
              mediaGallerySource.insertBefore(
                sourceData.item,
                mediaGallerySource.querySelector(`li:nth-of-type(${destinationIndex + 1})`)
              );

              // refresh source now that it has been modified
              [mediaGallerySourceItems, sourceSet, sourceMap] = refreshSourceData();
            }
          });
        }

        // set featured media as active in the media gallery
        mediaGallery?.setActiveMedia?.(nextMediaId, true);

        // update media modal
        const modalContent = this.productModal?.querySelector(`.product-media-modal__content`);
        const newModalContent = html.querySelector(`product-modal .product-media-modal__content`);
        if (modalContent && newModalContent) modalContent.innerHTML = newModalContent.innerHTML;
      }

      setQuantityBoundries() {
        const data = {
          cartQuantity: this.quantityInput.dataset.cartQuantity ? parseInt(this.quantityInput.dataset.cartQuantity) : 0,
          min: this.quantityInput.dataset.min ? parseInt(this.quantityInput.dataset.min) : 1,
          max: this.quantityInput.dataset.max ? parseInt(this.quantityInput.dataset.max) : null,
          step: this.quantityInput.step ? parseInt(this.quantityInput.step) : 1,
        };

        let min = data.min;
        const max = data.max === null ? data.max : data.max - data.cartQuantity;
        if (max !== null) min = Math.min(min, max);
        if (data.cartQuantity >= data.min) min = Math.min(min, data.step);

        this.quantityInput.min = min;

        if (max) {
          this.quantityInput.max = max;
        } else {
          this.quantityInput.removeAttribute('max');
        }
        this.quantityInput.value = min;

        publish(PUB_SUB_EVENTS.quantityUpdate, undefined);
      }

      fetchQuantityRules() {
        const currentVariantId = this.productForm?.variantIdInput?.value;
        if (!currentVariantId) return;

        this.querySelector('.quantity__rules-cart .loading__spinner').classList.remove('hidden');
        fetch(`${this.dataset.url}?variant=${currentVariantId}&section_id=${this.dataset.section}`)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            this.updateQuantityRules(this.dataset.section, html);
          })
          .catch((e) => console.error(e))
          .finally(() => this.querySelector('.quantity__rules-cart .loading__spinner').classList.add('hidden'));
      }

      updateQuantityRules(sectionId, html) {
        if (!this.quantityInput) return;
        this.setQuantityBoundries();

        const quantityFormUpdated = html.getElementById(`Quantity-Form-${sectionId}`);
        const selectors = ['.quantity__input', '.quantity__rules', '.quantity__label'];
        for (let selector of selectors) {
          const current = this.quantityForm.querySelector(selector);
          const updated = quantityFormUpdated.querySelector(selector);
          if (!current || !updated) continue;
          if (selector === '.quantity__input') {
            const attributes = ['data-cart-quantity', 'data-min', 'data-max', 'step'];
            for (let attribute of attributes) {
              const valueUpdated = updated.getAttribute(attribute);
              if (valueUpdated !== null) {
                current.setAttribute(attribute, valueUpdated);
              } else {
                current.removeAttribute(attribute);
              }
            }
          } else {
            current.innerHTML = updated.innerHTML;
          }
        }
      }

      get productForm() {
        return this.querySelector(`product-form`);
      }

      get productModal() {
        return document.querySelector(`#ProductModal-${this.dataset.section}`);
      }

      get pickupAvailability() {
        return this.querySelector(`pickup-availability`);
      }

      get variantSelectors() {
        return this.querySelector('variant-selects');
      }

      get relatedProducts() {
        const relatedProductsSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          'related-products'
        );
        return document.querySelector(`product-recommendations[data-section-id^="${relatedProductsSectionId}"]`);
      }

      get quickOrderList() {
        const quickOrderListSectionId = SectionId.getIdForSection(
          SectionId.parseId(this.sectionId),
          'quick_order_list'
        );
        return document.querySelector(`quick-order-list[data-id^="${quickOrderListSectionId}"]`);
      }

      get sectionId() {
        return this.dataset.originalSection || this.dataset.section;
      }
    }
  );
}
