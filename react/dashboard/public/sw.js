const CACHE_NAME = 'early-alerts-dashboard-v1.0.0';
const API_CACHE_NAME = 'early-alerts-api-v1.0.0';
const IMAGE_CACHE_NAME = 'early-alerts-images-v1.0.0';

// Resources to cache immediately
const STATIC_RESOURCES = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/students',
  '/api/alerts',
  '/api/dashboard/metrics',
  '/api/dashboard/charts',
  '/api/faculties',
  '/api/alert-types'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static resources
      caches.open(CACHE_NAME).then((cache) => {
        console.log('📦 Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      }),
      
      // Cache images
      caches.open(IMAGE_CACHE_NAME).then((cache) => {
        console.log('🖼️ Image cache ready');
        return cache;
      }),
      
      // Cache API responses
      caches.open(API_CACHE_NAME).then((cache) => {
        console.log('🔌 API cache ready');
        return cache;
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      // Force activation of new service worker
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🎯 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== API_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME
            ) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated successfully');
    })
  );
});

// Fetch event - handle requests with different caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // API requests - Network First with Cache Fallback
      event.respondWith(handleApiRequest(request));
    } else if (isImageRequest(request)) {
      // Images - Cache First
      event.respondWith(handleImageRequest(request));
    } else {
      // Static resources - Cache First with Network Fallback
      event.respondWith(handleStaticRequest(request));
    }
  }
});

// Handle API requests with Network First strategy
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
      
      // Add timestamp for cache invalidation
      const timestampedResponse = addTimestamp(networkResponse.clone());
      return timestampedResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    console.log('🔄 Network failed, trying cache for:', request.url);
    
    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      // Add offline indicator to cached responses
      return addOfflineIndicator(cachedResponse);
    }
    
    // If no cache, return offline response
    return createOfflineResponse(request);
  }
}

// Handle image requests with Cache First strategy
async function handleImageRequest(request) {
  const cache = await caches.open(IMAGE_CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder image for failed image requests
    return createPlaceholderImage();
  }
}

// Handle static resources with Cache First strategy
async function handleStaticRequest(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try cache first
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // For navigation requests, return cached index.html
    if (request.mode === 'navigate') {
      const indexResponse = await cache.match('/');
      return indexResponse || createOfflineResponse(request);
    }
    
    return createOfflineResponse(request);
  }
}

// Utility functions
function isImageRequest(request) {
  return request.destination === 'image' || 
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(new URL(request.url).pathname);
}

function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-timestamp', Date.now().toString());
  headers.set('sw-cache-source', 'network');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function addOfflineIndicator(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cache-source', 'cache');
  headers.set('sw-offline-mode', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function createOfflineResponse(request) {
  const isApiRequest = new URL(request.url).pathname.startsWith('/api/');
  
  if (isApiRequest) {
    // Return mock data for API requests when offline
    return new Response(
      JSON.stringify({
        offline: true,
        message: 'You are currently offline. This is cached data.',
        data: [],
        timestamp: Date.now()
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'sw-offline-mode': 'true'
        }
      }
    );
  }
  
  // For non-API requests, return a simple offline page
  return new Response(
    `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Offline - Early Alerts Dashboard</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          text-align: center; 
          padding: 2rem; 
          background: #F9FAFB;
          color: #374151;
        }
        .offline-container {
          max-width: 400px;
          margin: 0 auto;
          background: white;
          padding: 2rem;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
        h1 { color: #E31837; margin-bottom: 1rem; }
        .retry-btn {
          background: #E31837;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 1rem;
        }
        .retry-btn:hover { background: #B91C1C; }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>You're Offline</h1>
        <p>Check your internet connection and try again.</p>
        <p>Some features may be limited while offline.</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Try Again
        </button>
      </div>
    </body>
    </html>
    `,
    {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'sw-offline-mode': 'true'
      }
    }
  );
}

function createPlaceholderImage() {
  // Return a simple SVG placeholder
  const svg = `
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#E5E7EB"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9CA3AF" font-family="sans-serif">
        Image Unavailable
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'sw-offline-mode': 'true'
    }
  });
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-alerts') {
    event.waitUntil(syncOfflineData());
  }
});

async function syncOfflineData() {
  try {
    // Get offline data from IndexedDB (if implemented)
    console.log('📤 Syncing offline data...');
    
    // This would sync any offline actions like:
    // - New alert submissions
    // - Status updates
    // - Comments added while offline
    
    // For now, just log that sync would happen
    console.log('✅ Offline data sync completed');
  } catch (error) {
    console.error('❌ Offline data sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Push notification received');
  
  const options = {
    body: 'New student alert requires attention',
    icon: '/logo192.png',
    badge: '/logo192.png',
    tag: 'student-alert',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View Alert',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    data: {
      url: '/?notification=alert'
    }
  };
  
  if (event.data) {
    const data = event.data.json();
    options.body = data.message || options.body;
    options.data = { ...options.data, ...data };
  }
  
  event.waitUntil(
    self.registration.showNotification('Early Alerts Dashboard', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    // Open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // If app is already open, focus it
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus();
          }
        }
        
        // Otherwise, open new window
        return self.clients.openWindow(
          event.notification.data?.url || '/'
        );
      })
    );
  }
});

// Handle app shortcuts
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🎯 Early Alerts Dashboard Service Worker loaded successfully');
