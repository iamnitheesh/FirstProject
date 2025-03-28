import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import katex from "katex";

// Make katex globally available for our custom hook
window.katex = katex;

// Service worker is now registered via the serviceWorker.ts file
// using workbox APIs for better offline support

createRoot(document.getElementById("root")!).render(<App />);
