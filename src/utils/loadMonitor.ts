/**
 * Load Monitor Utility
 * Monitors page load time and automatically triggers a hard refresh
 * if the page takes too long to load (similar to Ctrl+F5)
 */

const LOAD_TIMEOUT = 10000; // 10 seconds - adjust as needed
const MAX_RETRIES = 3; // Maximum auto-refresh attempts
const RETRY_DELAY = 2000; // 2 seconds delay between retries

interface LoadMonitorConfig {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  enabled?: boolean;
}

class LoadMonitor {
  private startTime: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private retryCount: number = 0;
  private config: Required<LoadMonitorConfig>;
  private isMonitoring: boolean = false;

  constructor(config: LoadMonitorConfig = {}) {
    this.config = {
      timeout: config.timeout ?? LOAD_TIMEOUT,
      maxRetries: config.maxRetries ?? MAX_RETRIES,
      retryDelay: config.retryDelay ?? RETRY_DELAY,
      enabled: config.enabled ?? true,
    };
    this.startTime = Date.now();
    
    // Get retry count from session storage
    const storedRetries = sessionStorage.getItem('loadMonitorRetries');
    if (storedRetries) {
      this.retryCount = parseInt(storedRetries, 10) || 0;
    }
  }

  /**
   * Start monitoring page load time
   */
  start(): void {
    if (!this.config.enabled || this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.startTime = Date.now();

    // Check if page is already loaded
    if (document.readyState === 'complete') {
      this.checkLoadTime();
    } else {
      // Monitor until page is fully loaded
      window.addEventListener('load', () => {
        this.checkLoadTime();
      });

      // Fallback timeout
      this.timeoutId = setTimeout(() => {
        this.handleTimeout();
      }, this.config.timeout);
    }

    // Also monitor for slow initial render
    this.monitorInitialRender();
  }

  /**
   * Check if page loaded within timeout
   */
  private checkLoadTime(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const loadTime = Date.now() - this.startTime;
    
    if (loadTime > this.config.timeout) {
      console.warn(`[LoadMonitor] Page took ${loadTime}ms to load (threshold: ${this.config.timeout}ms)`);
      this.handleTimeout();
    } else {
      console.log(`[LoadMonitor] Page loaded in ${loadTime}ms`);
      // Reset retry count on successful load
      this.retryCount = 0;
      sessionStorage.removeItem('loadMonitorRetries');
    }
  }

  /**
   * Monitor initial render (React hydration)
   */
  private monitorInitialRender(): void {
    // Check if root element is rendered
    let renderCheckCount = 0;
    const maxChecks = Math.floor(this.config.timeout / 100); // Check every 100ms
    
    const checkRender = setInterval(() => {
      renderCheckCount++;
      const rootElement = document.getElementById('root');
      const hasContent = rootElement && rootElement.children.length > 0;
      
      if (hasContent) {
        clearInterval(checkRender);
        // Give it a moment for React to hydrate
        setTimeout(() => {
          const renderTime = Date.now() - this.startTime;
          if (renderTime > this.config.timeout) {
            console.warn(`[LoadMonitor] Initial render took ${renderTime}ms`);
            this.handleTimeout();
          }
        }, 1000);
      } else if (renderCheckCount >= maxChecks) {
        // If we've checked many times and still no content, something is wrong
        clearInterval(checkRender);
        const renderTime = Date.now() - this.startTime;
        if (renderTime > this.config.timeout) {
          console.warn(`[LoadMonitor] No content rendered after ${renderTime}ms`);
          this.handleTimeout();
        }
      }
    }, 100);

    // Stop checking after timeout
    setTimeout(() => {
      clearInterval(checkRender);
    }, this.config.timeout);
  }

  /**
   * Handle timeout - trigger hard refresh
   */
  private handleTimeout(): void {
    if (this.retryCount >= this.config.maxRetries) {
      console.error(`[LoadMonitor] Max retries (${this.config.maxRetries}) reached. Stopping auto-refresh.`);
      this.retryCount = 0;
      sessionStorage.removeItem('loadMonitorRetries');
      return;
    }

    this.retryCount++;
    sessionStorage.setItem('loadMonitorRetries', this.retryCount.toString());
    
    console.log(`[LoadMonitor] Triggering hard refresh (attempt ${this.retryCount}/${this.config.maxRetries})...`);
    
    // Wait a bit before refreshing to avoid immediate loop
    setTimeout(() => {
      this.hardRefresh();
    }, this.config.retryDelay);
  }

  /**
   * Perform a hard refresh (equivalent to Ctrl+F5)
   */
  private hardRefresh(): void {
    // Method 1: Reload with cache bypass using timestamp
    const url = new URL(window.location.href);
    url.searchParams.set('_refresh', Date.now().toString());
    
    // Method 2: Use location.reload() with cache bypass
    // Note: location.reload(true) is deprecated, but we can use cache headers
    if ('serviceWorker' in navigator) {
      // Try to unregister service worker cache first
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister();
        });
      });
    }
    
    // Force reload bypassing cache
    window.location.href = url.toString();
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Reset retry count
   */
  reset(): void {
    this.retryCount = 0;
    sessionStorage.removeItem('loadMonitorRetries');
  }
}

// Create singleton instance
let loadMonitorInstance: LoadMonitor | null = null;

/**
 * Initialize load monitor
 */
export function initLoadMonitor(config?: LoadMonitorConfig): LoadMonitor {
  if (!loadMonitorInstance) {
    loadMonitorInstance = new LoadMonitor(config);
  }
  return loadMonitorInstance;
}

/**
 * Get load monitor instance
 */
export function getLoadMonitor(): LoadMonitor | null {
  return loadMonitorInstance;
}

export default LoadMonitor;

