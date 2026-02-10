import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "@/App";
import "@/styles/globals.css";
import { registerServiceWorker } from "@/pwa/registerSW";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element #root was not found.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

registerServiceWorker();
