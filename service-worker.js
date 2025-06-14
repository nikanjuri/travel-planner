const CACHE_NAME = 'travel-planner-v1';
const OFFLINE_URL = '/offline.html';

// Core app shell files to cache immediately
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/favicon.ico',
  '/Copenhagen.json',
  '/Stockholm.json',
  // External dependencies
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Ensure the new service worker takes control immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (event.request.destination === 'document') {
    // HTML requests - cache first, network fallback
    event.respondWith(handleDocumentRequest(event.request));
  } else if (event.request.url.includes('.json')) {
    // JSON requests - cache first, network fallback
    event.respondWith(handleJsonRequest(event.request));
  } else if (event.request.url.includes('tile.openstreetmap.org')) {
    // Map tiles - cache with expiration
    event.respondWith(handleMapTileRequest(event.request));
  } else {
    // Other assets - cache first
    event.respondWith(handleAssetRequest(event.request));
  }
});

// Handle HTML document requests
async function handleDocumentRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try to serve offline page
    const cachedResponse = await caches.match('/index.html');
    return cachedResponse || new Response('Offline - Please check your connection');
  }
}

// Handle JSON requests (city data)
async function handleJsonRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version or error
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({
      error: 'Offline - City data unavailable',
      offline: true
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle map tile requests
async function handleMapTileRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses (with size limit)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME + '-tiles');
      
      // Only cache if we haven't hit our tile limit
      const keys = await cache.keys();
      if (keys.length < 100) { // Limit to 100 tiles
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached tile or placeholder
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('', { status: 404 });
  }
}

// Handle other asset requests
async function handleAssetRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Asset unavailable offline', { status: 404 });
  }
}

// Background sync for when connection returns
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Could sync any pending data here
  }
});

// Push notifications (for future use)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico'
    });
  }
}); 