self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};

  const title = data.title || "Player Check-In";
  const options = {
    body: data.body || "A player has checked in!",
    icon: "/icon.png",
    badge: "/badge.png",
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/check-in"));
});
