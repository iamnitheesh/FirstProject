import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import katex from "katex";

// Make katex globally available for our custom hook
window.katex = katex;

// Register service worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
