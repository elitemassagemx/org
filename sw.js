// Versión del cache - cambiar cuando se actualice el contenido
const CACHE_VERSION = 'v1.0.0';

// Nombres de los caches
const CACHE_NAMES = {
    static: `static-${CACHE_VERSION}`,
    images: `images-${CACHE_VERSION}`,
    fonts: `fonts-${CACHE_VERSION}`,
    dynamic: `dynamic-${CACHE_VERSION}`
};

// Recursos a cachear inmediatamente
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/main.css',
    '/css/base.css',
    '/css/components/carousel.css',
    '/css/components/gallery.css',
    '/css/components/popup.css',
    '/css/components/services.css',
    '/js/main.js',
    '/js/modules/services.js',
    '/js/modules/carousel.js',
    '/js/modules/gallery.js',
    '/js/modules/popup.js',
    '/js/modules/packages.js',
    '/js/modules/experiences.js',
    '/js/modules/animation.js',
    '/js/utils/dom.js',
    '/js/utils/events.js',
    '/js/utils/image.js',
    '/js/utils/logger.js',
    '/js/utils/performance.js',
    '/js/utils/common.js',
    '/favicon.ico',
    '/manifest.json',
    // Bootstrap y otros recursos CDN
    'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.5/ScrollTrigger.min.js'
];

// URLs de imágenes a pre-cachear
const IMAGE_ASSETS = [
    'https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/logo.webp',
    'https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/fallback-logo.webp',
    'https://raw.githubusercontent.com/elitemassagemx/Home/main/IMG/error.webp'
];

// URLs de fuentes a pre-cachear
const FONT_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Tenor+Sans&display=swap',
    'https://fonts.googleapis.com/css2?family=Quattrocento:wght@400;700&display=swap'
];

// Instalación del Service Worker
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            // Cache estático
            caches.open(CACHE_NAMES.static)
                .then(cache => cache.addAll(STATIC_ASSETS)),
            
            // Cache de imágenes
            caches.open(CACHE_NAMES.images)
                .then(cache => cache.addAll(IMAGE_ASSETS)),
            
            // Cache de fuentes
            caches.open(CACHE_NAMES.fonts)
                .then(cache => cache.addAll(FONT_ASSETS))
        ]).then(() => self.skipWaiting())
    );
});

// Activación y limpieza de caches antiguos
self.addEventListener('activate', event => {
    event.waitUntil(
        Promise.all([
            // Tomar el control inmediatamente
            self.clients.claim(),
            
            // Limpiar caches antiguos
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // Verificar si el cache no está en uso
                        if (!Object.values(CACHE_NAMES).includes(cacheName)) {
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Estrategias de caché por tipo de recurso
const cacheStrategies = {
    // Cache first, luego red para recursos estáticos
    cacheFirst: async (request) => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAMES.static);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        } catch (error) {
            return new Response('Network error happened', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
            });
        }
    },

    // Network first, con fallback a cache para contenido dinámico
    networkFirst: async (request) => {
        try {
            const networkResponse = await fetch(request);
            if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAMES.dynamic);
                cache.put(request, networkResponse.clone());
                return networkResponse;
            }
        } catch (error) {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
                return cachedResponse;
            }
        }
        
        return new Response('Network error happened', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    },

    // Stale while revalidate para recursos que se actualizan frecuentemente
    staleWhileRevalidate: async (request) => {
        const cachedResponse = await caches.match(request);
        
        const fetchPromise = fetch(request).then(async (networkResponse) => {
            if (networkResponse.ok) {
                const cache = await caches.open(CACHE_NAMES.dynamic);
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        });

        return cachedResponse || fetchPromise;
    }
};

// Interceptar peticiones
self.addEventListener('fetch', event => {
    // Ignorar peticiones de analytics y otras que no queremos cachear
    if (shouldIgnore(event.request)) {
        return;
    }

    // Elegir estrategia según el tipo de recurso
    const strategy = getStrategy(event.request);
    
    event.respondWith(strategy(event.request));
});

// Determinar si una petición debe ser ignorada
function shouldIgnore(request) {
    const ignoredHosts = [
        'google-analytics.com',
        'analytics',
        'doubleclick.net'
    ];

    return ignoredHosts.some(host => request.url.includes(host));
}

// Determinar la estrategia según el tipo de recurso
function getStrategy(request) {
    // URLs estáticas
    if (STATIC_ASSETS.includes(request.url) || request.url.endsWith('.css') || request.url.endsWith('.js')) {
        return cacheStrategies.cacheFirst;
    }
    
    // Imágenes
    if (request.destination === 'image' || IMAGE_ASSETS.includes(request.url)) {
        return cacheStrategies.cacheFirst;
    }
    
    // Fuentes
    if (request.destination === 'font' || FONT_ASSETS.includes(request.url)) {
        return cacheStrategies.cacheFirst;
    }
    
    // API y contenido dinámico
    if (request.url.includes('/api/') || request.url.includes('data.json')) {
        return cacheStrategies.networkFirst;
    }
    
    // Por defecto, stale while revalidate
    return cacheStrategies.staleWhileRevalidate;
}

// Manejar mensajes del cliente
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Manejar errores
self.addEventListener('error', event => {
    console.error('Service Worker error:', event.filename, event.lineno, event.message);
});

// Manejar errores de promesas no capturadas
self.addEventListener('unhandledrejection', event => {
    console.error('Service Worker unhandled rejection:', event.reason);
});
