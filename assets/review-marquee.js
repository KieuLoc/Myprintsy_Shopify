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

  function reviewPhoto(review) {
    const pic = review.querySelector('.jdgm-rev__pic-link');
    const href = pic?.getAttribute('href') || pic?.getAttribute('data-mfp-src') || '';
    if (!href) return '';
    const absolute = href.startsWith('//') ? 'https:' + href : href;
    return absolute.replace(/&amp;/g, '&');
  }

  function cardEl(item) {
    const card = document.createElement('div');
    card.className = 'image-marquee__card';
    const link = document.createElement('a');
    link.className = 'image-marquee__media';
    link.href = item.href;
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.alt = item.title || item.author;
    img.src = item.photo;
    link.appendChild(img);
    const caption = document.createElement('p');
    caption.className = 'image-marquee__caption';
    caption.textContent = '@' + item.author.replace(/^@/, '');
    card.append(link, caption);
    return card;
  }

  function fill(root, html, limit) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const items = [];
    for (const review of doc.querySelectorAll('.jdgm-rev')) {
      if (items.length >= limit) break;
      const author = review.querySelector('.jdgm-rev__author')?.textContent.trim() || '';
      const link = review.querySelector('.jdgm-rev__prod-link');
      const href = link?.getAttribute('href') || '';
      const photo = reviewPhoto(review);
      if (!author || !href || !photo) continue;
      items.push({
        author,
        href,
        photo,
        title: (link.textContent || '').trim(),
      });
    }

    if (!items.length) return;

    const top = root.querySelector('.image-marquee__row--top');
    const bottom = root.querySelector('.image-marquee__row--bottom');
    if (!top || !bottom) return;
    items.forEach((item, index) => {
      (index % 2 === 0 ? top : bottom).appendChild(cardEl(item));
    });
    root.hidden = false;
    document.dispatchEvent(new Event('shopify:section:load'));
  }

  function init() {
    document.querySelectorAll('[data-review-marquee]').forEach(boot);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  document.addEventListener('shopify:section:load', init);
})();
