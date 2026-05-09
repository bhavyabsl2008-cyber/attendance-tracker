// sw.js — Service Worker for Attendance Tracker PWA

const CACHE = 'att-tracker-v1';

// FIX: only cache local app shell at install time.
// CDN assets (Chart.js, fonts) were hardcoded before — if URL changes, install fails silently.
// Now they are cached at runtime on first successful fetch instead.
const SHELL = [
    './',
    './index.html',
    './css/style.css',
    './js/storage.js',
    './js/calculator.js',
    './js/settings.js',
    './js/charts.js',
    './js/ui.js',
    './js/app.js',
    './manifest.json'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE).then(cache => cache.addAll(SHELL))
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    const isSameOrigin = event.request.url.startsWith(self.location.origin);

    if (isSameOrigin) {
        // Cache-first for local files
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) return cached;
                return fetch(event.request).then(res => {
                    if (res && res.status === 200)
                        caches.open(CACHE).then(c => c.put(event.request, res.clone()));
                    return res;
                }).catch(() => {
                    if (event.request.mode === 'navigate')
                        return caches.match('./index.html');
                });
            })
        );
    } else {
        // Network-first for CDN (Chart.js, Google Fonts) — cache on success for offline
        event.respondWith(
            fetch(event.request).then(res => {
                if (res && res.status === 200)
                    caches.open(CACHE).then(c => c.put(event.request, res.clone()));
                return res;
            }).catch(() => caches.match(event.request))
        );
    }
});