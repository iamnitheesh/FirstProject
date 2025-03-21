import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import katex from "katex";

// Make katex globally available for our custom hook
window.katex = katex;

createRoot(document.getElementById("root")!).render(<App />);
