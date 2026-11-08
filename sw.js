/* Service Worker — oflayn rejim va kesh */
var CACHE = 'asama-v8';
var STATIC = [
  '/',
  '/index.html',
  '/catalog.html',
  '/product.html',
  '/cart.html',
  '/about.html',
  '/favicon.svg',
  '/assets/css/style.css?v=8',
  '/assets/css/animate.css?v=8',
  '/assets/css/features.css?v=8',
  '/assets/css/more-features.css?v=1',
  '/assets/css/new-features.css?v=1',
  '/assets/js/config.js?v=8',
  '/assets/js/i18n.js?v=8',
  '/assets/js/products.js?v=8',
  '/assets/js/features.js?v=8',
  '/assets/js/more-features.js?v=1',
  '/assets/js/new-features.js?v=1',
  '/assets/js/animate.js?v=8',
  '/assets/js/app.js?v=8',
  '/assets/img/logo-mark.svg',
  '/assets/img/logo-mark-white.svg',
  '/assets/img/cat-pipes.svg',
  '/assets/img/cat-fittings.svg',
  '/assets/img/cat-boilers.svg',
  '/assets/img/cat-radiators.svg',
  '/assets/img/cat-valves.svg',
  '/assets/img/cat-mixers.svg',
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(STATIC.map(function (url) {
        return new Request(url, { cache: 'reload' });
      })).catch(function () {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  if (e.request.url.indexOf('order.php') !== -1) return;
  if (e.request.url.indexOf('fonts.googleapis') !== -1 || e.request.url.indexOf('fonts.gstatic') !== -1) return;

  e.respondWith(
    caches.match(e.request).then(function (cached) {
      var fetchPromise = fetch(e.request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var clone = response.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return response;
      }).catch(function () { return cached; });
      return cached || fetchPromise;
    })
  );
});
