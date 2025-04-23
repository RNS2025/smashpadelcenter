import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Optional: Prompt for PWA installation
let deferredPrompt: any;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log("PWA install prompt available");
});

// Example: Add a button to trigger installation
document.addEventListener("DOMContentLoaded", () => {
  const installButton = document.createElement("button");
  installButton.textContent = "Install App";
  installButton.style.display = "none";
  installButton.className =
    "fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded";
  document.body.appendChild(installButton);

  if (deferredPrompt) {
    installButton.style.display = "block";
    installButton.addEventListener("click", async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      deferredPrompt = null;
      installButton.style.display = "none";
    });
  }
});

window.addEventListener("appinstalled", () => {
  console.log("PWA was installed");
});
