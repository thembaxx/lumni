import { logError } from "@/lib/shared/logger";
import { loadFromStorage, saveToStorage } from "@/lib/utils/storage";
import { NOTIF_KEY, VAPID_PUBLIC_KEY } from "./types";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)));
}

async function syncSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  try {
    await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userId: loadFromStorage<string>("lumni_user_id", ""),
      }),
    });
  } catch (err) {
    logError("Notif.SyncSubscription", err);
  }
}

async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    logError("Notif.PushNotSupported", new Error("Push not supported"));
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      saveToStorage(NOTIF_KEY, JSON.stringify(existing));
      syncSubscriptionToServer(existing);
      return existing;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    });

    saveToStorage(NOTIF_KEY, JSON.stringify(subscription));
    syncSubscriptionToServer(subscription);
    return subscription;
  } catch (error) {
    logError("SubscribeToPush", error);
    return null;
  }
}

async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      const json = subscription.toJSON();
      await subscription.unsubscribe();
      try {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint }),
        } as NotificationOptions);
      } catch (e) {
        logError("Notif.UnsubscribeSync", e);
      }
    }
    localStorage.removeItem(NOTIF_KEY);
    return true;
  } catch (e) {
    logError("Notif.Unsubscribe", e);
    return false;
  }
}

async function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;

  const result = await Notification.requestPermission();
  return result === "granted";
}

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
