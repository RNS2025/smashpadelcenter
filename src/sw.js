import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";

// Determine production environment from env variable// Precache assets
const isProduction =
  self.location.hostname !== "localhost" &&
  !self.location.hostname.includes("127.0.0.1");

const CACHE_STRATEGY = isProduction ? "networkFirst" : "networkOnly";

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/") && isProduction,
  new NetworkFirst()
);
console.log(
  `Service Worker running in ${
    isProduction ? "production" : "development"
  } mode`
);
console.log(`Using cache strategy: ${CACHE_STRATEGY}`);
precacheAndRoute(self.__WB_MANIFEST);

// Push notification event listener
self.addEventListener("push", function (event) {
  console.log("Push notification received:", event);

  if (event.data) {
    const data = event.data.json();
    console.log("Push notification data:", data);

    const options = {
      body: data.message,
      icon: "/icons/android-chrome-192x192.png",
      badge: "/icons/android-chrome-192x192.png",
      tag: data.id || "default-tag",
      data: {
        url: data.route || "/",
        link: data.link,
        notificationData: data.data,
      },
      actions: [
        {
          action: "open",
          title: "Åbn app",
          icon: "/icons/android-chrome-192x192.png",
        },
        {
          action: "close",
          title: "Luk",
          icon: "/icons/android-chrome-192x192.png",
        },
      ],
      requireInteraction: true, // Keep notification until user interacts
      vibrate: [200, 100, 200], // Vibration pattern
      timestamp: Date.now(),
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Notification click event listener
self.addEventListener("notificationclick", function (event) {
  console.log("Notification clicked:", event);

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  // Default action or 'open' action
  const urlToOpen = event.notification.data?.url || "/";
  const link = event.notification.data?.link;

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then(function (clientList) {
        // Check if app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin)) {
            // Navigate to the notification URL
            client.navigate(urlToOpen);
            return client.focus();
          }
        }

        // Open new window if app is not open
        if (link) {
          return clients.openWindow(link);
        } else {
          return clients.openWindow(self.location.origin + urlToOpen);
        }
      })
  );
});

// Notification close event listener
self.addEventListener("notificationclose", function (event) {
  console.log("Notification closed:", event);
  // Optional: Track notification dismissals
});

// Optional: Install/Activate events
self.addEventListener("install", (event) => self.skipWaiting());
self.addEventListener("activate", (event) => self.clients.claim());
