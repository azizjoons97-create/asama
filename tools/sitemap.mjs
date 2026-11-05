// sitemap.xml ni products.js asosida qayta yaratadi: node tools/sitemap.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = fileURLToPath(new URL('..', import.meta.url));
const SITE = 'https://asama.uz/';
const ctx = { window: {} };
vm.runInNewContext(readFileSync(root + 'assets/js/products.js', 'utf8'), ctx);

const urls = [
  ['', '1.0'],
  ['catalog.html', '0.9'],
  ...ctx.window.CATEGORIES.map((c) => [`catalog.html?cat=${encodeURIComponent(c.id)}`, '0.8']),
  ...ctx.window.PRODUCTS.map((p) => [`product.html?sku=${encodeURIComponent(p.sku)}`, '0.7']),
  ['about.html', '0.5'],
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(([path, pr]) => `  <url><loc>${(SITE + path).replace(/&/g, '&amp;')}</loc><priority>${pr}</priority></url>`).join('\n') +
  '\n</urlset>\n';

writeFileSync(root + 'sitemap.xml', xml);
console.log(`sitemap.xml: ${urls.length} ta manzil`);
