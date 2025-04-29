// sw.js

// Set environment flag
const isProduction = self.location.hostname !== "localhost";

// Create a simple logger for the service worker
const logger = {
  info: (message, data) => {
    console.log(message, data);
  },
  error: (message, data) => {
    console.error(message, data);
  },
};

// Dynamic URL mapping based on notification categories
const preferenceUrlMap = {
  updates: "/court-times", // Court Updates
  messages: "/messages", // New Messages
  events: "/events", // Event Reminders
  promotions: "/promotions", // Promotions & Offers
  makkerbors: "/makkerbors", // Partner Board
  rangliste: "/rangliste", // Rankings
  nyheder: "/news", // News
  turneringer: "/turneringer", // Tournaments
  general: "/hjem", // Fallback for unspecified categories
};

self.addEventListener("push", (event) => {
  // Parse the incoming push data
  const data = event.data ? event.data.json() : {};

  // Extract the notification object from the payload
  const notification = data.notification || {};

  // Default values if fields are missing
  const title = notification.title || "Notification";
  const body = notification.body || "You have a new notification.";
  const image = notification.image || "/default-icon.png"; // Fallback icon
  const category = notification.category || "general"; // Fallback category
  const notificationId = notification.notificationId || null;

  // Notification options
  const options = {
    body: body,
    icon: image,
    data: {
      category: category,
      notificationId: notificationId, // Store for use in click handling
    },
    badge: "/badge.png", // Optional: add a badge icon if you have one
    vibrate: [200, 100, 200], // Optional: vibration pattern
    timestamp: Date.now(), // Show when the notification was received
  };

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() =>
        logger.info(`Notification displayed: ${title}`, {
          category,
          notificationId,
        })
      )
      .catch((error) =>
        logger.error(`Error displaying notification: ${title}`, {
          error: error.message,
          category,
          notificationId,
        })
      )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close(); // Close the notification when clicked

  // Get the category from the notification data
  const category = event.notification.data?.category || "general";

  // Determine the URL to open based on the category
  const urlToOpen = preferenceUrlMap[category] || preferenceUrlMap["general"];

  // Open or focus the window
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's an existing window/tab to focus
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            return client.focus();
          }
        }
        // If no matching window is found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) =>
        console.error("Error handling notification click:", error)
      )
  );
});

// Optional: Handle service worker activation
self.addEventListener("activate", (event) => {
  console.log("Service worker activated");
  event.waitUntil(self.clients.claim()); // Take control of pages immediately
});
