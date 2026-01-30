import React from 'react';
import ReactDOM from 'react-dom/client';
import './src/index.css';
import App from './App';

// Only register Service Worker and Load Monitor in PRODUCTION
// These add overhead during development and slow down hot reloading
const isDev = import.meta.env.DEV;

if (!isDev && 'serviceWorker' in navigator) {
  // Check if user has disabled service worker
  const swDisabled = localStorage.getItem('sw_disabled') === 'true';

  if (!swDisabled) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[SW] Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[SW] New service worker available. Refreshing...');
                  // Auto-update when new SW is ready
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              });
            }
          });
        })
        .catch((error) => {
          console.error('[SW] Service Worker registration failed:', error);
        });
    });
  }
}

// Load Monitor - disabled in development for faster loading
// In production, this auto-refreshes if page takes too long to load
if (!isDev) {
  const loadMonitorEnabled = localStorage.getItem('loadMonitor_disabled') !== 'true';

  if (loadMonitorEnabled) {
    import('./src/utils/loadMonitor').then(({ initLoadMonitor }) => {
      const loadMonitor = initLoadMonitor({
        timeout: 10000, // 10 seconds timeout
        maxRetries: 3, // Maximum 3 auto-refresh attempts
        retryDelay: 2000, // 2 seconds between retries
        enabled: true,
      });

      loadMonitor.start();

      if (typeof window !== 'undefined') {
        (window as any).loadMonitor = loadMonitor;
      }
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);