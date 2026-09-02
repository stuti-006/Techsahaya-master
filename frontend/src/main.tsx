import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./index.css";
import { AppProvider } from "./context/AppContext";
import { TourProvider } from "./context/TourContext";

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  // Ensure development environment is not blocked by stale service worker caches
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <TourProvider>
          <App />
        </TourProvider>
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);

