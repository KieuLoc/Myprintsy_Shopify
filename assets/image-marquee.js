(function () {
  const instances = new WeakMap();

  class MarqueeInstance {
    constructor(root) {
      this.root = root;
      this.track = root.querySelector('.image-marquee__track');
      this.firstGroup = root.querySelector('.image-marquee__group');
      const scroller = root.closest('[data-image-marquee], .image-marquee-scroller');
      this.shouldAnimate = scroller ? scroller.dataset.autoscroll !== 'false' : true;
      this._fillLock = false;
      this.isPaused = false;
      this.offset = 0;
      this.lastTime = performance.now();
      this.rafId = null;
    }

    init() {
      if (!this.track || !this.firstGroup) return;

      this.isReverse = this.track.classList.contains('image-marquee__track--reverse');

      this.onMouseEnter = () => {
        this.isPaused = true;
      };
      this.onMouseLeave = () => {
        this.isPaused = false;
      };

      if (this.root.classList.contains('image-marquee--pause-on-hover')) {
        this.root.addEventListener('mouseenter', this.onMouseEnter);
        this.root.addEventListener('mouseleave', this.onMouseLeave);
      }

      this.resizeObserver = new ResizeObserver(() => {
        this.fillTrack();
        this.measure();
      });
      this.resizeObserver.observe(this.root);
      this.resizeObserver.observe(this.firstGroup);

      this.firstGroup.querySelectorAll('img').forEach((img) => {
        if (!img.complete) {
          img.addEventListener(
            'load',
            () => {
              this.fillTrack();
              this.measure();
            },
            { once: true }
          );
        }
      });

      this.fillTrack();
      this.measure();

      if (this.shouldAnimate) {
        this.track.classList.add('image-marquee__track--js');
        this.tick = this.tick.bind(this);
        this.rafId = requestAnimationFrame(this.tick);
      }
    }

    destroy() {
      if (this.rafId) cancelAnimationFrame(this.rafId);
      this.resizeObserver?.disconnect();
      this.root?.removeEventListener('mouseenter', this.onMouseEnter);
      this.root?.removeEventListener('mouseleave', this.onMouseLeave);
    }

    removeRowSpacers(group) {
      group.querySelectorAll('.image-marquee__row-spacer').forEach((spacer) => spacer.remove());
    }

    removePaddedCards(group) {
      group.querySelectorAll('.image-marquee__card--pad').forEach((card) => card.remove());
    }

    getRowSourceCards(row) {
      return [...row.querySelectorAll('.image-marquee__card:not(.image-marquee__card--pad)')];
    }

    appendFullCycle(row, sources) {
      sources.forEach((source) => {
        const clone = source.cloneNode(true);
        clone.classList.add('image-marquee__card--pad');
        clone.setAttribute('aria-hidden', 'true');
        row.appendChild(clone);
      });
    }

    padRowToWidth(row, targetWidth) {
      const sources = this.getRowSourceCards(row);
      if (!sources.length || targetWidth <= 0) return;

      let guard = 0;
      while (row.scrollWidth < targetWidth && guard < 20) {
        this.appendFullCycle(row, sources);
        guard += 1;
      }
    }

    getGroupScrollWidth(group) {
      if (!group.classList.contains('image-marquee__group--double')) {
        return group.scrollWidth;
      }

      const topRow = group.querySelector('.image-marquee__row--top');
      const bottomRow = group.querySelector('.image-marquee__row--bottom');
      if (!topRow || !bottomRow) return group.scrollWidth;

      return Math.max(topRow.scrollWidth, bottomRow.scrollWidth);
    }

    balanceRowWidths(group) {
      if (!group.classList.contains('image-marquee__group--double')) return;

      const topRow = group.querySelector('.image-marquee__row--top');
      const bottomRow = group.querySelector('.image-marquee__row--bottom');
      if (!topRow || !bottomRow) return;

      this.removeRowSpacers(group);
      this.removePaddedCards(group);

      const targetWidth = Math.max(topRow.scrollWidth, bottomRow.scrollWidth);
      this.padRowToWidth(topRow, targetWidth);
      this.padRowToWidth(bottomRow, targetWidth);
    }

    getTrackGap() {
      const gapValue = getComputedStyle(this.track).columnGap || getComputedStyle(this.track).gap;
      return parseFloat(gapValue) || 0;
    }

    getLoopStep(groupWidth) {
      return groupWidth + this.getTrackGap();
    }

    getLoopWidth() {
      if (this.track.children.length >= 2) {
        const loopWidth = this.track.children[1].offsetLeft - this.track.children[0].offsetLeft;
        if (loopWidth > 0) return loopWidth;
      }

      const groupWidth = this.getGroupScrollWidth(this.firstGroup);
      return this.getLoopStep(groupWidth);
    }

    fillTrack() {
      if (this._fillLock) return;
      this._fillLock = true;

      try {
        this.removeRowSpacers(this.firstGroup);
        this.removePaddedCards(this.firstGroup);
        this.balanceRowWidths(this.firstGroup);

        const containerWidth = this.root.getBoundingClientRect().width;
        let groupWidth = this.getGroupScrollWidth(this.firstGroup);

        if (!groupWidth) return;

        while (this.track.children.length > 1) {
          this.track.removeChild(this.track.lastElementChild);
        }

        const loopStep = this.getLoopStep(groupWidth);
        const minTrackWidth = containerWidth + loopStep;
        let trackWidth = groupWidth;
        let cloneIndex = 2;

        while (trackWidth < minTrackWidth) {
          const clone = this.firstGroup.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.dataset.marqueeClone = String(cloneIndex);
          this.track.appendChild(clone);
          trackWidth += loopStep;
          cloneIndex += 1;
        }

        while (this.track.children.length < 2) {
          const clone = this.firstGroup.cloneNode(true);
          clone.setAttribute('aria-hidden', 'true');
          clone.dataset.marqueeClone = String(cloneIndex);
          this.track.appendChild(clone);
          cloneIndex += 1;
        }

        this.groupWidth = this.getLoopWidth();
      } finally {
        this._fillLock = false;
      }
    }

    measure() {
      const durationValue = getComputedStyle(this.root).getPropertyValue('--marquee-duration').trim();
      const durationSeconds = parseFloat(durationValue) || 55;
      this.groupWidth = this.getLoopWidth();
      this.speed = this.groupWidth > 0 ? this.groupWidth / durationSeconds : 0;
    }

    tick(now) {
      if (!this.isPaused && this.speed > 0 && this.groupWidth > 0) {
        const delta = (now - this.lastTime) / 1000;

        if (this.isReverse) {
          this.offset -= this.speed * delta;
          while (this.offset <= 0) this.offset += this.groupWidth;
          this.track.style.transform = `translate3d(${this.offset - this.groupWidth}px, 0, 0)`;
        } else {
          this.offset += this.speed * delta;
          while (this.offset >= this.groupWidth) this.offset -= this.groupWidth;
          this.track.style.transform = `translate3d(-${this.offset}px, 0, 0)`;
        }
      }

      this.lastTime = now;
      this.rafId = requestAnimationFrame(this.tick);
    }
  }

  function initRoot(root) {
    if (!root) return;
    if (instances.has(root)) {
      instances.get(root).destroy();
    }
    const instance = new MarqueeInstance(root);
    instances.set(root, instance);
    instance.init();
  }

  function initAll() {
    document.querySelectorAll('.image-marquee').forEach(initRoot);
  }

  function boot() {
    initAll();
    window.addEventListener('load', initAll);
    document.addEventListener('shopify:section:load', initAll);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
