(function initNewsletterKlaviyoEmbeds() {
  if (window.__newsletterKlaviyoEmbedInit) return;
  window.__newsletterKlaviyoEmbedInit = true;

  const EMBED_SELECTOR = '[data-newsletter-klaviyo-embed]';
  const MAX_ATTEMPTS = 12;
  const HIDE_TEXT =
    /By subscribing, you agree to receive marketing communications|BECOME AN INSIDER|Join our\s*VIP Perks|Get first access to new collections/i;

  function triggerKlaviyoScan(forceLayoutNudge) {
    window._klOnsite = window._klOnsite || [];
    window._klOnsite.push(['refreshForms']);

    if (forceLayoutNudge) {
      window.dispatchEvent(new Event('resize'));
    }
  }

  function getEmbedTarget(slot, formId) {
    if (!slot || !formId) return null;
    return slot.querySelector(`.klaviyo-form-${formId}`);
  }

  function hasKlaviyoEmbedContent(slot, formId) {
    const target = getEmbedTarget(slot, formId);
    if (!target || target.childElementCount === 0) return false;

    return Boolean(
      target.querySelector(
        'input[type="email"], input[name="email"], form, button[type="submit"], .klaviyo-form-version-cid'
      )
    );
  }

  function resetBox(el) {
    if (!el || !el.style) return;
    el.style.setProperty('position', 'static', 'important');
    el.style.setProperty('left', 'auto', 'important');
    el.style.setProperty('right', 'auto', 'important');
    el.style.setProperty('transform', 'none', 'important');
    el.style.setProperty('float', 'none', 'important');
    el.style.setProperty('margin-left', '0', 'important');
    el.style.setProperty('margin-right', '0', 'important');
    el.style.setProperty('box-sizing', 'border-box', 'important');
  }

  function tidyKlaviyoForm(slot) {
    if (!slot) return;
    const root = slot.querySelector('.klaviyo-form-Yy9PSK') || slot;
    const isMobile = window.matchMedia('(max-width: 749px)').matches;

    root.querySelectorAll('[data-testid="form-row"]').forEach((row) => {
      const hasEmail = row.querySelector('input[type="email"], input[name="email"]');
      const hasButton = row.querySelector('.klaviyo-form-button, button[type="button"]');
      if (hasEmail || hasButton) {
        resetBox(row);
        row.style.setProperty('display', 'flex', 'important');
        row.style.setProperty('flex-direction', isMobile ? 'column' : 'row', 'important');
        row.style.setProperty('flex-wrap', isMobile ? 'nowrap' : 'nowrap', 'important');
        row.style.setProperty('justify-content', isMobile ? 'flex-start' : 'center', 'important');
        row.style.setProperty('align-items', isMobile ? 'stretch' : 'center', 'important');
        row.style.setProperty('width', '100%', 'important');
        row.style.setProperty('max-width', '100%', 'important');
        row.style.setProperty('gap', '1rem', 'important');
        if (!isMobile) {
          row.style.setProperty('margin-left', 'auto', 'important');
          row.style.setProperty('margin-right', 'auto', 'important');
        }
        return;
      }

      const text = (row.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || HIDE_TEXT.test(text)) {
        row.classList.add('myprintsy-hide-klaviyo-copy');
        row.style.setProperty('display', 'none', 'important');
      }
    });

    const fieldWrap = slot.closest('.newsletter-form__field-wrapper--klaviyo');
    if (fieldWrap) {
      fieldWrap.style.setProperty('width', '100%', 'important');
      fieldWrap.style.setProperty('max-width', isMobile ? '100%' : '72rem', 'important');
      fieldWrap.style.setProperty('margin-left', 'auto', 'important');
      fieldWrap.style.setProperty('margin-right', 'auto', 'important');
      fieldWrap.style.setProperty('box-sizing', 'border-box', 'important');
      fieldWrap.style.setProperty('overflow-x', 'hidden', 'important');
    }

    root.querySelectorAll('input[type="email"], input[name="email"]').forEach((input) => {
      resetBox(input);
      input.style.setProperty('width', '100%', 'important');
      input.style.setProperty('min-width', '0', 'important');
      input.style.setProperty('max-width', '100%', 'important');

      const component = input.closest('[data-testid="form-component"]');
      if (component) {
        resetBox(component);
        component.style.setProperty('flex', isMobile ? '0 0 auto' : '1 1 48rem', 'important');
        component.style.setProperty('max-width', isMobile ? '100%' : '48rem', 'important');
        component.style.setProperty('width', isMobile ? '100%' : 'min(48rem, 62vw)', 'important');
        component.style.setProperty('min-width', '0', 'important');
        component.style.setProperty('align-self', isMobile ? 'stretch' : 'center', 'important');
      }
    });

    root.querySelectorAll('.klaviyo-form-button, button[type="button"]').forEach((btn) => {
      resetBox(btn);
      btn.style.setProperty('margin', '0', 'important');

      if (isMobile) {
        btn.style.setProperty('width', '100%', 'important');
        btn.style.setProperty('min-width', '0', 'important');
        btn.style.setProperty('max-width', '100%', 'important');
        btn.style.setProperty('flex-shrink', '1', 'important');
        btn.style.setProperty('align-self', 'stretch', 'important');
      } else {
        btn.style.setProperty('width', 'auto', 'important');
        btn.style.setProperty('min-width', '14rem', 'important');
        btn.style.setProperty('flex-shrink', '0', 'important');
      }

      const component = btn.closest('[data-testid="form-component"]');
      if (component) {
        resetBox(component);
        if (isMobile) {
          component.style.setProperty('flex', '0 0 auto', 'important');
          component.style.setProperty('width', '100%', 'important');
          component.style.setProperty('max-width', '100%', 'important');
          component.style.setProperty('align-self', 'stretch', 'important');
        } else {
          component.style.setProperty('flex', '0 0 auto', 'important');
          component.style.setProperty('width', 'auto', 'important');
          component.style.setProperty('max-width', 'none', 'important');
        }
        component.style.setProperty('min-width', '0', 'important');
      }
    });

    const formCol = root.querySelector('form > div');
    if (formCol) {
      resetBox(formCol);
      formCol.style.setProperty('display', 'flex', 'important');
      formCol.style.setProperty('flex-direction', 'column', 'important');
      formCol.style.setProperty('align-items', isMobile ? 'stretch' : 'center', 'important');
      formCol.style.setProperty('justify-content', 'center', 'important');
      formCol.style.setProperty('width', '100%', 'important');
      formCol.style.setProperty('max-width', isMobile ? '100%' : '72rem', 'important');
      formCol.style.setProperty('min-height', '0', 'important');
      formCol.style.setProperty('padding', '0', 'important');
      if (!isMobile) {
        formCol.style.setProperty('margin-left', 'auto', 'important');
        formCol.style.setProperty('margin-right', 'auto', 'important');
      }
    }
  }

  function bootstrapSlot(slot) {
    const formId = (slot.dataset.klaviyoFormId || '').trim();
    if (!formId) return;

    let attempts = 0;

    const probe = () => {
      attempts += 1;

      if (hasKlaviyoEmbedContent(slot, formId)) {
        tidyKlaviyoForm(slot);
        return;
      }

      triggerKlaviyoScan(attempts === 1);

      if (attempts < MAX_ATTEMPTS) {
        window.setTimeout(probe, attempts <= 2 ? 500 : 900);
      }
    };

    window.requestAnimationFrame(probe);
  }

  function bootstrapAll() {
    const slots = document.querySelectorAll(EMBED_SELECTOR);
    if (!slots.length) return;

    triggerKlaviyoScan(true);
    slots.forEach(bootstrapSlot);
  }

  function observeSlots() {
    if (!('IntersectionObserver' in window)) return;

    const slots = document.querySelectorAll(EMBED_SELECTOR);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          bootstrapSlot(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '120px 0px' }
    );

    slots.forEach((slot) => observer.observe(slot));
  }

  function onReady() {
    bootstrapAll();
    observeSlots();

    let n = 0;
    const timer = window.setInterval(() => {
      document.querySelectorAll(EMBED_SELECTOR).forEach(tidyKlaviyoForm);
      n += 1;
      if (n >= 40) window.clearInterval(timer);
    }, 500);

    window.addEventListener(
      'resize',
      function () {
        document.querySelectorAll(EMBED_SELECTOR).forEach(tidyKlaviyoForm);
      },
      { passive: true }
    );

    if (typeof MutationObserver === 'function') {
      document.querySelectorAll(EMBED_SELECTOR).forEach(function (slot) {
        const obs = new MutationObserver(function () {
          window.clearTimeout(slot.__myprintsyKlaviyoTidyTimer);
          slot.__myprintsyKlaviyoTidyTimer = window.setTimeout(function () {
            tidyKlaviyoForm(slot);
          }, 80);
        });
        obs.observe(slot, { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
        window.setTimeout(function () {
          try {
            obs.disconnect();
          } catch (_) {}
        }, 60000);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
