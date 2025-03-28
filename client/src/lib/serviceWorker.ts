import { Workbox } from 'workbox-window';

// Variable to store service worker registration
let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register the service worker
 */
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js');
    
    // Wait for the window to load before registering
    window.addEventListener('load', () => {
      // Register the service worker
      wb.register()
        .then(registration => {
          if (registration) {
            console.log('Service Worker registered with scope:', registration.scope);
            swRegistration = registration;
            
            // Listen for service worker updates
            setupSWUpdateListener(wb);
          }
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
    
    // Listen for messages from the service worker
    navigator.serviceWorker.addEventListener('message', event => {
      console.log('Message from Service Worker:', event.data);
      
      // Handle sync complete message
      if (event.data.type === 'SYNC_COMPLETED') {
        console.log('Background sync completed');
        // Notify any listeners about sync completion
      }
    });
  } else {
    console.warn('Service workers are not supported in this browser');
  }
}

/**
 * Setup listener for service worker updates
 */
function setupSWUpdateListener(wb: Workbox) {
  // Add update listener
  wb.addEventListener('waiting', event => {
    console.log('A new service worker is waiting to be installed.');
    
    // Show notification to user about update
    if (confirm('A new version of the app is available. Reload to update?')) {
      // Send message to the waiting service worker
      wb.messageSkipWaiting();
    }
  });
  
  // When the service worker takes over
  wb.addEventListener('controlling', () => {
    console.log('The new service worker has taken control');
    // Reload the page to ensure all assets are fresh
    window.location.reload();
  });
}

/**
 * Send a message to the active service worker
 */
export function sendMessageToSW(message: any) {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
    return true;
  }
  return false;
}

/**
 * Setup the offline detection
 * @param offlineCallback Function to call when going offline
 * @param onlineCallback Function to call when coming back online
 */
export function setupOfflineDetection(
  offlineCallback: () => void,
  onlineCallback: () => void
) {
  // Set initial state
  if (!navigator.onLine) {
    offlineCallback();
  }
  
  // Listen for online status changes
  window.addEventListener('online', () => {
    onlineCallback();
  });
  
  window.addEventListener('offline', () => {
    offlineCallback();
  });
}

/**
 * Check for service worker updates
 */
export async function checkForUpdates() {
  if (!swRegistration) return false;
  
  try {
    await swRegistration.update();
    return true;
  } catch (error) {
    console.error('Failed to check for updates:', error);
    return false;
  }
}

/**
 * Trigger manual sync
 */
export async function triggerSync() {
  if (!navigator.serviceWorker.controller) {
    console.warn('No active service worker found');
    return false;
  }
  
  // Send a message to trigger sync
  const syncPromise = new Promise<boolean>((resolve) => {
    // Set up a one-time listener for the sync complete message
    const messageListener = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SYNC_COMPLETED') {
        navigator.serviceWorker.removeEventListener('message', messageListener);
        resolve(event.data.success);
      }
    };
    
    navigator.serviceWorker.addEventListener('message', messageListener);
    
    // Set a timeout in case the sync message is never received
    setTimeout(() => {
      navigator.serviceWorker.removeEventListener('message', messageListener);
      resolve(false);
    }, 10000); // 10-second timeout
    
    // Trigger the sync
    sendMessageToSW({ type: 'TRIGGER_SYNC' });
  });
  
  return syncPromise;
}