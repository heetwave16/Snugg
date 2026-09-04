// Snugg service worker: install support + notifications. Network-first, no
// offline caching of app shell so OAuth/auth routes always hit the network.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = { title: "Snugg", body: "Something new in your group", url: "/notifications" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: payload.url },
    }),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};
  if (data.type === "snugg-notify") {
    self.registration.showNotification(data.title || "Snugg", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url || "/notifications" },
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/notifications";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const client = list[0];
      if (client) {
        client.focus();
        client.navigate(url);
        return;
      }
      return self.clients.openWindow(url);
    }),
  );
});
