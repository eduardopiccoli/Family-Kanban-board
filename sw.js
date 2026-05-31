/**
 * 🎮 Service Worker - Kanban Kids
 * Permite funcionamento offline
 */

const CACHE_NAME = 'kanban-kids-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/storage.js',
    './js/achievements.js',
    './js/kanban.js',
    './js/rewards.js',
    './js/app.js',
    './manifest.json'
];

// Instalação - cacheia assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativação - limpa caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

// Fetch - serve do cache, fallback para rede
self.addEventListener('fetch', (event) => {
    // Ignora requisições para CDN (Chart.js)
    if (event.request.url.includes('cdn.jsdelivr.net')) {
        event.respondWith(
            fetch(event.request).catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((fetchResponse) => {
                // Cacheia novas requisições
                if (fetchResponse.status === 200) {
                    const responseClone = fetchResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return fetchResponse;
            });
        }).catch(() => {
            // Fallback offline
            if (event.request.destination === 'document') {
                return caches.match('./index.html');
            }
        })
    );
});
