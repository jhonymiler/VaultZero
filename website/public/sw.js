const CACHE_NAME = 'vaultzero-v1.0.0'
const STATIC_CACHE_URLS = [
    '/',
    '/login',
    '/dashboard',
    '/demo',
    '/status',
    '/manifest.json',
    '/_next/static/css/app/layout.css',
    '/_next/static/css/app/globals.css'
]

// Install event - Cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...')

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets')
                return cache.addAll(STATIC_CACHE_URLS)
            })
            .catch((error) => {
                console.error('[SW] Error caching static assets:', error)
            })
    )

    // Force the waiting service worker to become the active service worker
    self.skipWaiting()
})

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...')

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName)
                        return caches.delete(cacheName)
                    }
                })
            )
        })
    )

    // Take control of all clients immediately
    return self.clients.claim()
})

// Fetch event - Network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
    const { request } = event
    const url = new URL(request.url)

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return
    }

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return
    }

    // API requests - Network-first strategy
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Clone the response before caching
                    const responseClone = response.clone()

                    // Cache successful responses
                    if (response.status === 200) {
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone)
                        })
                    }

                    return response
                })
                .catch(() => {
                    // Fallback to cache if network fails
                    return caches.match(request)
                })
        )
        return
    }

    // Static assets - Cache-first strategy
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.endsWith('.png') ||
        url.pathname.endsWith('.jpg') ||
        url.pathname.endsWith('.jpeg') ||
        url.pathname.endsWith('.svg') ||
        url.pathname.endsWith('.ico') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js')
    ) {
        event.respondWith(
            caches.match(request)
                .then((response) => {
                    if (response) {
                        return response
                    }

                    return fetch(request).then((response) => {
                        // Cache the fetched resource
                        const responseClone = response.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone)
                        })

                        return response
                    })
                })
        )
        return
    }

    // Pages - Stale-while-revalidate strategy
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                const fetchPromise = fetch(request)
                    .then((response) => {
                        // Update cache in the background
                        const responseClone = response.clone()
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone)
                        })

                        return response
                    })
                    .catch(() => {
                        // If network fails and we have a cached response, return it
                        if (cachedResponse) {
                            return cachedResponse
                        }

                        // If no cached response, return a fallback page
                        return caches.match('/')
                    })

                // Return cached response immediately if available, otherwise wait for network
                return cachedResponse || fetchPromise
            })
    )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag)

    if (event.tag === 'offline-login') {
        event.waitUntil(
            // Handle offline login requests
            handleOfflineLogin()
        )
    }
})

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push notification received:', event.data?.text())

    const options = {
        body: event.data?.text() || 'Nova notificação do VaultZero',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        tag: 'vaultzero-notification',
        actions: [
            {
                action: 'open',
                title: 'Abrir App'
            },
            {
                action: 'dismiss',
                title: 'Dispensar'
            }
        ]
    }

    event.waitUntil(
        self.registration.showNotification('VaultZero', options)
    )
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event.action)

    event.notification.close()

    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        )
    }
})

// Message handling from main thread
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data)

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting()
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME })
    }
})

// Helper functions
async function handleOfflineLogin() {
    try {
        // Get pending login requests from IndexedDB
        const requests = await getOfflineRequests()

        for (const request of requests) {
            try {
                const response = await fetch(request.url, {
                    method: request.method,
                    headers: request.headers,
                    body: request.body
                })

                if (response.ok) {
                    // Remove successful request from storage
                    await removeOfflineRequest(request.id)
                }
            } catch (error) {
                console.error('[SW] Failed to sync offline request:', error)
            }
        }
    } catch (error) {
        console.error('[SW] Error handling offline login:', error)
    }
}

async function getOfflineRequests() {
    // Implementation for getting offline requests from IndexedDB
    return []
}

async function removeOfflineRequest(id) {
    // Implementation for removing offline request from IndexedDB
    console.log('[SW] Removing offline request:', id)
}

console.log('[SW] Service Worker loaded successfully')
