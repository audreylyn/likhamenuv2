import React from "react";
import ReactDOM from "react-dom/client";
import "./src/index.css";
import App from "./App";

// Unregister any existing service workers to clean up old installations
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister();
      console.log("[SW] Unregistered old service worker");
    });
  });
}

// Simple load time logging (no auto-refresh)
const loadStartTime = performance.now();
window.addEventListener("load", () => {
  const loadTime = Math.round(performance.now() - loadStartTime);
  console.log(`[LoadMonitor] Page loaded in ${loadTime}ms`);
});

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
