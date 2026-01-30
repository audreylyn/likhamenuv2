/**
 * Load Monitor Utility
 * Simple utility to log page load times for debugging
 * No auto-refresh - just logging for performance monitoring
 */

/**
 * Log page load time to console
 */
export function logLoadTime(): void {
  if (typeof window === "undefined") return;

  const startTime = performance.now();

  if (document.readyState === "complete") {
    console.log(`[LoadMonitor] Page already loaded`);
    return;
  }

  window.addEventListener("load", () => {
    const loadTime = Math.round(performance.now() - startTime);
    console.log(`[LoadMonitor] Page loaded in ${loadTime}ms`);
  });
}

// Clear any old retry data from previous versions
if (typeof sessionStorage !== "undefined") {
  sessionStorage.removeItem("loadMonitorRetries");
}

// Clear old localStorage settings
if (typeof localStorage !== "undefined") {
  localStorage.removeItem("loadMonitor_disabled");
  localStorage.removeItem("sw_disabled");
}

// Legacy exports for backward compatibility (no-ops)
export function initLoadMonitor() {
  return {
    start: () => logLoadTime(),
    stop: () => {},
    reset: () => {},
  };
}

export function getLoadMonitor() {
  return null;
}

export default { logLoadTime, initLoadMonitor, getLoadMonitor };
