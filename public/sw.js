// Service Worker for Auto-Refresh on Slow Load
const CACHE_NAME = 'golden-crumb-v1';
const LOAD_TIMEOUT = 10000; // 10 seconds timeout
const MAX_RETRIES = 3; // Maximum number of auto-refresh attempts

// Install event - cache essential resources
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting(); // Activate immediately
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim(); // Take control of all pages immediately
});

// Fetch event - intercept network requests and monitor performance
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests and cross-origin requests
  if (event.request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Skip API endpoints and Supabase requests - let them pass through without interception
  // This improves performance in Chrome by avoiding service worker overhead on API calls
  const pathname = url.pathname.toLowerCase();
  const isApiRequest = 
    pathname.includes('/api/') ||
    pathname.includes('/rest/') ||
    pathname.includes('/realtime/') ||
    pathname.includes('/auth/') ||
    pathname.includes('/storage/') ||
    url.hostname.includes('supabase') ||
    url.hostname.includes('supabase.co') ||
    url.searchParams.has('apikey') ||
    event.request.headers.get('apikey');
  
  if (isApiRequest) {
    // Don't intercept API requests - let them pass through normally
    return;
  }

  // Only handle static assets (JS, CSS, images, fonts, etc.)
  const isStaticAsset = 
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.gif') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.eot') ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/src/');
  
  // Skip non-static assets to improve performance
  if (!isStaticAsset) {
    return;
  }

  // Monitor fetch performance for static assets only
  const fetchStartTime = Date.now();
  
  event.respondWith(
    (async () => {
      // Try cache first for static assets (faster in Chrome)
      const cachedResponse = await caches.match(event.request);
      if (cachedResponse) {
        const cacheTime = Date.now() - fetchStartTime;
        if (cacheTime > 100) {
          console.log(`[SW] Cache hit for ${url.pathname} (${cacheTime}ms)`);
        }
        return cachedResponse;
      }

      // Cache miss - fetch from network
      try {
        const networkResponse = await fetch(event.request);
        const fetchTime = Date.now() - fetchStartTime;
        
        // Log slow requests
        if (fetchTime > 3000) {
          console.warn(`[SW] Slow request detected: ${url.pathname} took ${fetchTime}ms`);
        }
        
        // Only cache successful responses
        if (networkResponse.status === 200) {
          // Cache asynchronously to avoid blocking the response
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch((err) => {
              // Silently fail caching - don't log to avoid console spam
            });
          });
        }
        
        return networkResponse;
      } catch (networkError) {
        // Network failed and no cache - return error response
        console.warn(`[SW] Network failed for ${url.pathname}`);
        return new Response('', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'text/plain'
          }
        });
      }
    })()
  );
});

// Message handler - receive messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_LOAD_TIME') {
    // Send back current time for load monitoring
    event.ports[0].postMessage({ loadTime: Date.now() });
  }
  
  if (event.data && event.data.type === 'FORCE_REFRESH') {
    // Notify all clients to refresh
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'FORCE_REFRESH' });
      });
    });
  }
});

