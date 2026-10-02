/**
 * Capture image network loads on a PDP — find unrelated assets like 1_01.png.
 */
const { chromium } = require('playwright');

const URL =
  process.env.PDP_URL ||
  'https://www.myprintsy.com/products/creep-it-real-personalized-accent-mug-gift-for-halloween-hwth1l30';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  /** @type {{url:string, initiator:string, type:string}[]} */
  const images = [];

  page.on('request', (req) => {
    const type = req.resourceType();
    if (type !== 'image' && type !== 'media') return;
    const url = req.url();
    let initiator = '';
    try {
      const i = req.initiator();
      initiator = [i?.type, i?.url, ...(i?.stack?.map((f) => f.url) || [])]
        .filter(Boolean)
        .join(' | ')
        .slice(0, 300);
    } catch (_) {}
    images.push({ url, initiator, type });
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(12000);
  // Scroll to trigger related products intersection observer
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 800) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 250));
    }
  });
  await page.waitForTimeout(5000);

  const hit = images.filter((x) => /1_01\.png|lemon|majolica|tumbler/i.test(x.url));
  const allFiles = images.filter((x) => /cdn\/shop\/files\//i.test(x.url));

  const summary = await page.evaluate(() => {
    const related = document.querySelector('product-recommendations');
    const cards = related
      ? Array.from(related.querySelectorAll('img')).map((img) => ({
          src: img.currentSrc || img.src,
          alt: img.alt,
          lazy: img.loading,
        }))
      : [];
    const htmlHas101 = document.documentElement.innerHTML.includes('1_01.png');
    return {
      title: document.title,
      relatedLoaded: !!related?.classList.contains('product-recommendations--loaded'),
      cardCount: cards.length,
      cards,
      htmlHas101,
      packCache: !!document.querySelector('script[src*="pack-preview-cache"]'),
    };
  });

  console.log(JSON.stringify({ summary, hitCount: hit.length, hit, allFilesCount: allFiles.length, allFilesSample: allFiles.slice(0, 40), totalImageReqs: images.length }, null, 2));
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
