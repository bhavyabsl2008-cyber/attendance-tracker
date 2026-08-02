// sw.js — Service worker for installability + basic offline fallback.
//
// Deliberately network-first, not cache-first: this app gets pushed updates
// often (bug fixes, timetable data), and a cache-first strategy would silently
// serve stale JS to students after every deploy. Caching is just a fallback
// for when the network is unavailable, not the primary source.
//
// Firebase/Google API requests are explicitly NOT intercepted — letting the
// service worker touch auth/Firestore requests can cause subtle sign-in and
// sync bugs that are hard to diagnose.

const CACHE_NAME = 'presynce-v1';
const APP_SHELL = [
    './',
    './index.html',
    './landing.html',
    './admin.html',
    './manifest.json',
    './css/style.css',
    './css/timetable.css',
    './icons/icon-192.png',
    './icons/icon-512.png',
];

const EXCLUDED_HOSTS = [
    'firebaseio.com',
    'googleapis.com',
    'gstatic.com',
    'google.com',
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Never intercept Firebase/Google requests — let them go straight to network
    if (EXCLUDED_HOSTS.some(host => url.hostname.includes(host))) return;
    // Only handle GET requests for our own origin
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request)
            .then(response => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
