import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

navigator.serviceWorker.register('/sw.js').then((registration) => {
    registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
            newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    const userConfirmed = confirm('En ny version er tilgængelig. Vil du genindlæse nu?');
                    if (userConfirmed) {
                        newWorker.postMessage({action: 'skipWaiting'});
                        window.location.reload();
                    }
                }
            });
        }
    });
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
