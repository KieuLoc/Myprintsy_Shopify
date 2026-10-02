/** Identify which storefront a Customily shop handle belongs to. */
const hosts = process.argv.slice(2).length
  ? process.argv.slice(2).map((h) => (h.includes('.') ? h : h + '.myshopify.com'))
  : ['pe1uf1-uk.myshopify.com', 'sqj5k3-d1.myshopify.com'];

(async () => {
  for (const h of hosts) {
    try {
      const res = await fetch('https://' + h, { redirect: 'follow' });
      const html = await res.text();
      const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '?';
      const canonical = (html.match(/rel=["']canonical["'][^>]*href=["']([^"']+)/i) || [])[1] || '?';
      console.log(`${h}\n  status: ${res.status}\n  final:  ${res.url}\n  title:  ${title.trim().slice(0, 70)}\n  canon:  ${canonical}\n`);
    } catch (e) {
      console.log(`${h}\n  ERROR: ${e.message}\n`);
    }
  }
})();
