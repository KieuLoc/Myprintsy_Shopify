if (!customElements.get('product-form')) {
  customElements.define(
    'product-form',
    class ProductForm extends HTMLElement {
      constructor() {
        super();

        this.form = this.querySelector('form');
        this.variantIdInput.disabled = false;
        this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
        this.submitButton = this.querySelector('[type="submit"]');

        if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

        this.hideErrors = this.dataset.hideErrors === 'true';
      }

      /**
       * Label span only — skip Myprintsy ATC icon span (first child after rewrite).
       * Caching querySelector('span') hit the icon → duplicate "Add to Cart" on size change.
       */
      get submitButtonText() {
        const btn = this.submitButton;
        if (!btn) return null;
        const preferred = btn.querySelector('span.text, span.fadeInDown.text');
        if (preferred) return preferred;
        for (const span of btn.querySelectorAll(':scope > span')) {
          if (span.classList.contains('myprintsy-btn-icon')) continue;
          if (span.hasAttribute('data-myprintsy-btn-icon')) continue;
          if (span.classList.contains('loading__spinner') || span.classList.contains('loading-overlay__spinner'))
            continue;
          if (span.querySelector('svg')) continue;
          return span;
        }
        return btn.querySelector('span:not(.myprintsy-btn-icon):not([data-myprintsy-btn-icon])');
      }

      /** Clear icon spans corrupted by writing ATC label into them. */
      repairSubmitButtonIcon() {
        const btn = this.submitButton;
        if (!btn) return;
        btn.querySelectorAll('.myprintsy-btn-icon, [data-myprintsy-btn-icon]').forEach((icon) => {
          if (icon.querySelector('svg')) return;
          if (!String(icon.textContent || '').trim()) return;
          icon.textContent = '';
        });
      }

      onSubmitHandler(evt) {
        evt.preventDefault();
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.handleErrorMessage();
        this.error = false;

        const fromPreviewAtc = Boolean(window.__myprintsyFromPreviewAtc);

        this.submitButton.setAttribute('aria-disabled', true);

        // Show cart-notification immediately; Customily may still be generating.
        // Do NOT pass fromUserGesture — early capture already armed; if user X'd, stay closed.
        if (this.cart && typeof this.cart.openOptimistic === 'function') {
          this.cart.openOptimistic();
        }

        // Preview ATC: spinner lives in the preview modal — hide PDP spinner.
        if (fromPreviewAtc) {
          this.submitButton.classList.remove('loading');
          this.querySelector('.loading__spinner')?.classList.add('hidden');
        } else {
          this.submitButton.classList.add('loading');
          this.querySelector('.loading__spinner')?.classList.remove('hidden');
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        delete config.headers['Content-Type'];

        const formData = new FormData(this.form);

        // Skip sections: Shopify re-rendering cart-notification HTML on /cart/add was ~the
        // theme-owned chunk of the 2.4s add. Popup is already optimistic; finalize from the
        // line-item JSON + a light /cart.js bubble refresh (see cart-notification.js).
        if (this.cart) {
          this.cart.setActiveElement(document.activeElement);
        }
        config.body = formData;

        fetch(`${routes.cart_add_url}`, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              publish(PUB_SUB_EVENTS.cartError, {
                source: 'product-form',
                productVariantId: formData.get('id'),
                errors: response.errors || response.description,
                message: response.message,
              });
              this.handleErrorMessage(response.description);
              if (this.cart && typeof this.cart.closeOptimistic === 'function') {
                this.cart.closeOptimistic();
              }

              const soldOutMessage = this.submitButton.querySelector('.sold-out-message');
              if (!soldOutMessage) return;
              this.submitButton.setAttribute('aria-disabled', true);
              this.submitButtonText?.classList.add('hidden');
              soldOutMessage.classList.remove('hidden');
              this.error = true;
              return;
            }

            this.error = false;

            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'product-form',
              productVariantId: formData.get('id'),
              cartData: response,
            });

            if (!this.cart) {
              window.location = window.routes.cart_url;
              return;
            }

            const quickAddModal = this.closest('quick-add-modal');
            if (quickAddModal) {
              document.body.addEventListener(
                'modalClosed',
                () => {
                  setTimeout(() => {
                    this.cart.renderContents(response);
                  });
                },
                { once: true }
              );
              quickAddModal.hide(true);
            } else {
              this.cart.renderContents(response);
            }
          })
          .then(() => {
            if (typeof addGiftWrapping === 'function') {
              addGiftWrapping();
            }
          })
          .catch((e) => {
            console.error(e);
            publish(PUB_SUB_EVENTS.cartError, {
              source: 'product-form',
              productVariantId: formData.get('id'),
              message: e && e.message,
            });
            if (this.cart && typeof this.cart.closeOptimistic === 'function') {
              this.cart.closeOptimistic();
            }
          })
          .finally(() => {
            if (window.__myprintsyFromPreviewAtc) {
              window.__myprintsyFromPreviewAtc = false;
              document.documentElement.classList.remove('myprintsy-preview-atc-inflight');
            }
            this.submitButton.classList.remove('loading');
            if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
            if (!this.error) this.submitButton.removeAttribute('aria-disabled');
            this.querySelector('.loading__spinner')?.classList.add('hidden');
          });
      }

      handleErrorMessage(errorMessage = false) {
        if (this.hideErrors) return;

        this.errorMessageWrapper =
          this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
        if (!this.errorMessageWrapper) return;
        this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

        this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

        if (errorMessage) {
          this.errorMessage.textContent = errorMessage;
        }
      }

      toggleSubmitButton(disable = true, text) {
        this.repairSubmitButtonIcon();
        const label = this.submitButtonText;
        if (disable) {
          this.submitButton.setAttribute('disabled', 'disabled');
          if (text && label) label.textContent = text;
        } else {
          this.submitButton.removeAttribute('disabled');
          if (label) label.textContent = window.variantStrings.addToCart;
        }
      }

      get variantIdInput() {
        return this.form.querySelector('[name=id]');
      }
    }
  );
}
