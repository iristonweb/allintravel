import { createRoot } from "react-dom/client";
import App from "./App";
import "./i18n";
import "./index.css";
import { ensureHistorySync } from "./lib/history-sync";

ensureHistorySync();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

createRoot(document.getElementById("root")!).render(<App />);
