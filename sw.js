self.addEventListener('install', e => {
  console.log('Service Worker instalado!');
});

self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request));
});

const cacheName = 'salonai-cache-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/196.png',
  '/512.png',
  '/191.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(filesToCache))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(response => response || fetch(e.request))
  );
});
