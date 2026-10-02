fetch(
  'https://wanderprints.com/cdn/shop/t/178/assets/dist.tailwind.min.css?v=18717917412358150711784186638',
  { headers: { 'User-Agent': 'Mozilla/5.0' } }
)
  .then((r) => r.text())
  .then((css) => {
    let idx = 0;
    while ((idx = css.indexOf('wp-text-', idx + 1)) !== -1) {
      const snippet = css.slice(idx, idx + 80);
      if (snippet.includes('neutral') || snippet.includes('60')) {
        console.log(snippet);
      }
    }
  })
  .catch(console.error);
