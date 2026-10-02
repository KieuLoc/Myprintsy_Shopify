(function () {
  const MODAL_ID = 'CartPreviewModal';
  const CHECKOUT_URL = '/checkout';
  let lastFocus = null;

  function ensureModal() {
    let modal = document.getElementById(MODAL_ID);
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'cart-preview-modal';
    modal.setAttribute('hidden', '');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Product preview');
    modal.innerHTML = `
      <button type="button" class="cart-preview-modal__overlay" data-cart-preview-close aria-label="Close preview"></button>
      <div class="cart-preview-modal__dialog">
        <button type="button" class="cart-preview-modal__close" data-cart-preview-close aria-label="Close preview">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
            <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
          </svg>
        </button>
        <div class="cart-preview-modal__image-wrap">
          <img class="cart-preview-modal__image" data-cart-preview-image alt="" width="800" height="800">
        </div>
        <a class="cart-preview-modal__checkout" href="${CHECKOUT_URL}">Proceed To Checkout</a>
      </div>
    `;
    document.body.appendChild(modal);
    return modal;
  }

  function openModal(src, alt) {
    if (!src) return;
    const modal = ensureModal();
    const img = modal.querySelector('[data-cart-preview-image]');
    lastFocus = document.activeElement;

    img.src = src;
    img.alt = alt || 'Product preview';
    modal.removeAttribute('hidden');
    document.body.classList.add('cart-preview-modal-open');

    const closeBtn = modal.querySelector('.cart-preview-modal__close');
    if (closeBtn) closeBtn.focus();
  }

  function closeModal() {
    const modal = document.getElementById(MODAL_ID);
    if (!modal || modal.hasAttribute('hidden')) return;

    modal.setAttribute('hidden', '');
    document.body.classList.remove('cart-preview-modal-open');

    const img = modal.querySelector('[data-cart-preview-image]');
    if (img) {
      img.removeAttribute('src');
      img.alt = '';
    }

    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus();
    }
    lastFocus = null;
  }

  document.addEventListener('click', function (event) {
    const trigger = event.target.closest('[data-cart-preview-trigger]');
    if (trigger) {
      event.preventDefault();
      event.stopPropagation();
      openModal(trigger.getAttribute('data-preview-src'), trigger.getAttribute('data-preview-alt'));
      return;
    }

    if (event.target.closest('[data-cart-preview-close]')) {
      event.preventDefault();
      closeModal();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    const modal = document.getElementById(MODAL_ID);
    if (modal && !modal.hasAttribute('hidden')) {
      closeModal();
    }
  });
})();
