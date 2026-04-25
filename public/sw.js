// Service Worker for Smart Fit Tracker PWA
const CACHE_NAME = 'fit-tracker-v1';
const STATIC_CACHE = 'fit-tracker-static-v1';

// Ресурсы для кеширования
const PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
];

// Install — кешируем статику
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Activate — удаляем старые кеши
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== STATIC_CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch — стратегия:
// API запросы → Network First (всегда свежие данные)
// Статика → Cache First
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Пропускаем не-GET запросы и Supabase/API запросы
  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('sttgeo.ru')) return;
  if (url.hostname.includes('telegram.org')) return;

  // Для навигационных запросов — возвращаем index.html (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Для статики — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
