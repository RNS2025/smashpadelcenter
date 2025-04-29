import { precacheAndRoute } from 'workbox-precaching';

// Precache assets
precacheAndRoute(self.__WB_MANIFEST);

// Optional: Install/Activate events
self.addEventListener('install', (event) => self.skipWaiting());
self.addEventListener('activate', (event) => self.clients.claim());

// Logger
const logger = {
    info: (message, data) => console.log(message, data),
    error: (message, data) => console.error(message, data),
};

// Dynamic URL mapping
const preferenceUrlMap = {
    updates: "/court-times",
    messages: "/messages",
    events: "/events",
    promotions: "/promotions",
    makkerbors: "/makkerbors",
    rangliste: "/rangliste",
    nyheder: "/news",
    turneringer: "/turneringer",
    general: "/hjem",
};

// Push event
self.addEventListener("push", (event) => {
    const data = event.data ? event.data.json() : {};
    const notification = data.notification || {};
    const title = notification.title || "Notification";
    const body = notification.body || "You have a new notification.";
    const image = notification.image || "/default-icon.png";
    const category = notification.category || "general";
    const notificationId = notification.notificationId || null;

    const options = {
        body,
        icon: image,
        data: {
            category,
            notificationId,
        },
        badge: "/badge.png",
        vibrate: [200, 100, 200],
        timestamp: Date.now(),
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
            .then(() => logger.info(`Notification displayed: ${title}`, { category, notificationId }))
            .catch((error) => logger.error(`Error displaying notification: ${title}`, { error: error.message, category, notificationId }))
    );
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const category = event.notification.data?.category || "general";
    const urlToOpen = preferenceUrlMap[category] || preferenceUrlMap["general"];

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true })
            .then((clientList) => {
                for (const client of clientList) {
                    if (client.url.includes(urlToOpen) && "focus" in client) {
                        return client.focus();
                    }
                }
                if (clients.openWindow) {
                    return clients.openWindow(urlToOpen);
                }
            })
            .catch((error) => console.error("Error handling notification click:", error))
    );
});
