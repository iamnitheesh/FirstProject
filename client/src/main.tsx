import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import "./index.css";
import katex from "katex";
import { queryClient } from "./lib/queryClient";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ApiProvider } from "./lib/ApiContext";

// Make katex globally available for our custom hook
window.katex = katex;

// Service worker is now registered via the serviceWorker.ts file
// using workbox APIs for better offline support

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </QueryClientProvider>
);
