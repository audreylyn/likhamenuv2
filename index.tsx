import ReactDOM from "react-dom/client";
import "./src/index.css";
import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Render immediately - no blocking operations
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

// Cleanup and logging AFTER render (non-blocking)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => registration.unregister());
  });
}

const loadStartTime = performance.now();
window.addEventListener("load", () => {
  console.log(
    `[LoadMonitor] Page loaded in ${Math.round(performance.now() - loadStartTime)}ms`,
  );
});
