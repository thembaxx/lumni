export function sendLocalNotification(title: string, body: string, url = "/dashboard"): void {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  navigator.serviceWorker.ready.then((registration) => {
    registration.showNotification(title, {
      body,
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      data: { url, timestamp: Date.now() },
      actions: [
        { action: "study", title: "Open" },
        { action: "snooze", title: "Later" },
      ],
    } as unknown as NotificationOptions);
  });
}
