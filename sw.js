/* LUMEN — service worker : cache d'abord, hors ligne après le premier chargement. */
var CACHE = 'lumen-v2.1.1';
var ASSETS = [
  './',
  'index.html',
  'privacy.html',
  'defi.js',
  'style.css',
  'engine.js',
  'progress.js',
  'audio.js',
  'app.js',
  'levels.json',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-512.png',
  'fonts/unbounded-latin-400-normal.woff2',
  'fonts/unbounded-latin-700-normal.woff2',
  'fonts/unbounded-latin-900-normal.woff2',
  'fonts/instrument-sans-latin-400-normal.woff2',
  'fonts/instrument-sans-latin-600-normal.woff2'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k.indexOf('lumen-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
