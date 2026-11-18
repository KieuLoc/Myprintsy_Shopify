(function () {
  const FEED = 'https://cdn.judge.me/reviews/all_reviews_js_based?platform=shopify&shop_domain=';

  function boot(root) {
    if (!root || root.dataset.reviewLoaded === '1') return;
    root.dataset.reviewLoaded = '1';
    const shop = root.dataset.shop;
    const limit = Number(root.dataset.limit) || 10;
    if (!shop) return;

    fetch(FEED + encodeURIComponent(shop))
      .then((response) => {
        if (!response.ok) throw new Error('reviews ' + response.status);
        return response.json();
      })
      .then((data) => fill(root, data.html || '', limit))
      .catch(function () {});
  }

  function productImage(href) {
    const path = String(href || '').split('?')[0];
    if (!path) return Promise.resolve('');
    return fetch(path + '.js')
      .then((response) => (response.ok ? response.json() : null))
      .then((product) => {
        const image = product && product.featured_image;
        const url = typeof image === 'string' ? image : image && image.src;
        if (!url) return '';
        const absolute = url.startsWith('//') ? 'https:' + url : url;
        return absolute.includes('width=') ? absolute : absolute + (absolute.includes('?') ? '&' : '?') + 'width=540';
      })
      .catch(function () {
        return '';
      });
  }

  function cardEl(item, src) {
    const card = document.createElement('div');
    card.className = 'image-marquee__card';
    const link = document.createElement('a');
    link.className = 'image-marquee__media';
    link.href = item.href;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = item.title || item.author;
    img.src = src;
    link.appendChild(img);
    const caption = document.createElement('p');
    caption.className = 'image-marquee__caption';
    caption.textContent = '@' + item.author.replace(/^@/, '');
    card.append(link, caption);
    return card;
  }

  function fill(root, html, limit) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const reviews = [...doc.querySelectorAll('.jdgm-rev')].slice(0, limit);
    const items = reviews
      .map((review) => {
        const author = review.querySelector('.jdgm-rev__author')?.textContent.trim() || '';
        const link = review.querySelector('.jdgm-rev__prod-link');
        const href = link?.getAttribute('href') || '';
        if (!author || !href) return null;
        return { author, href, title: (link.textContent || '').trim() };
      })
      .filter(Boolean);

    if (!items.length) return Promise.resolve();

    return Promise.all(items.map((item) => productImage(item.href))).then((images) => {
      const top = root.querySelector('.image-marquee__row--top');
      const bottom = root.querySelector('.image-marquee__row--bottom');
      if (!top || !bottom) return;
      items.forEach((item, index) => {
        if (!images[index]) return;
        (index % 2 === 0 ? top : bottom).appendChild(cardEl(item, images[index]));
      });
      if (!root.querySelector('.image-marquee__card')) return;
      root.hidden = false;
      document.dispatchEvent(new Event('shopify:section:load'));
    });
  }

  function init() {
    document.querySelectorAll('[data-review-marquee]').forEach(boot);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('shopify:section:load', init);
})();
