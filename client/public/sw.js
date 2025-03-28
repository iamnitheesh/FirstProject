// Service Worker for FormulaNote Application
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js');

// Configure workbox
workbox.setConfig({
  debug: false
});

// Use precache to cache important files
workbox.precaching.precacheAndRoute([
  { url: '/', revision: '2' },
  { url: '/index.html', revision: '2' },
  { url: '/manifest.json', revision: '2' },
  { url: '/favicon.ico', revision: '1' },
  { url: '/icons/icon-192x192.png', revision: '1' },
  { url: '/icons/icon-512x512.png', revision: '1' }
]);

// Cache external dependencies
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://cdn.jsdelivr.net',
  new workbox.strategies.CacheFirst({
    cacheName: 'external-libs',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache Google Fonts stylesheets
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://fonts.googleapis.com',
  new workbox.strategies.CacheFirst({
    cacheName: 'google-fonts-stylesheets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Cache KaTeX resources (for math rendering)
workbox.routing.registerRoute(
  ({url}) => url.origin === 'https://cdn.jsdelivr.net' && url.pathname.includes('/katex/'),
  new workbox.strategies.CacheFirst({
    cacheName: 'katex-resources',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Cache images
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache JavaScript and CSS
workbox.routing.registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Cache API requests
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Cache font files
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'font',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'fonts',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// Default fallback for navigation requests
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  new workbox.strategies.NetworkFirst({
    cacheName: 'pages',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
      }),
    ],
  })
);

// Background sync for pending operations
const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('sync-queue', {
  maxRetentionTime: 24 * 60 // Retry for up to 24 hours (specified in minutes)
});

// Register POST/PUT/DELETE routes for API endpoints with background sync
workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'POST'
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'PUT'
);

workbox.routing.registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new workbox.strategies.NetworkOnly({
    plugins: [bgSyncPlugin]
  }),
  'DELETE'
);

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    // Manually trigger sync
    performSync()
      .then(success => {
        // Send response back to client
        event.source.postMessage({
          type: 'SYNC_COMPLETED',
          success
        });
      })
      .catch(error => {
        console.error('Error in manual sync:', error);
        event.source.postMessage({
          type: 'SYNC_COMPLETED',
          success: false,
          error: error.message
        });
      });
  }
});

// Function to perform manual sync
async function performSync() {
  try {
    // Check if we have pending operations in IndexedDB
    const db = await openDatabase();
    const pendingOps = await getPendingOperations(db);
    
    if (pendingOps.length === 0) {
      console.log('No pending operations to sync');
      return true;
    }
    
    console.log(`Syncing ${pendingOps.length} operations...`);
    
    // Sort operations by timestamp (oldest first)
    pendingOps.sort((a, b) => a.timestamp - b.timestamp);
    
    let success = true;
    
    for (const op of pendingOps) {
      try {
        const result = await fetch(op.endpoint, {
          method: op.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: op.method !== 'DELETE' ? JSON.stringify(op.payload) : undefined
        });
        
        if (result.ok) {
          // Remove the pending operation if successful
          await removePendingOperation(db, op.id);
        } else {
          console.error(`Failed to sync operation ${op.id}: ${result.statusText}`);
          success = false;
        }
      } catch (error) {
        console.error(`Error syncing operation ${op.id}:`, error);
        success = false;
      }
    }
    
    // Update last synced timestamp
    if (success) {
      await updateLastSynced(db);
    }
    
    return success;
  } catch (error) {
    console.error('Error during manual sync:', error);
    return false;
  }
}

// Helper functions for IndexedDB operations

async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('flashcard-app', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function getPendingOperations(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-operations'], 'readonly');
    const store = transaction.objectStore('pending-operations');
    const request = store.getAll();
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function removePendingOperation(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pending-operations'], 'readwrite');
    const store = transaction.objectStore('pending-operations');
    const request = store.delete(id);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function updateLastSynced(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['app-state'], 'readwrite');
    const store = transaction.objectStore('app-state');
    const request = store.put({ value: Date.now() }, 'lastSyncedAt');
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}