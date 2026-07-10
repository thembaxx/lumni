import type { PushPayload, PushDeliveryResult } from "./push-types";

export type { PushPayload, PushDeliveryResult };

export interface PushDispatchPort {
  sendToUser(userId: string, payload: PushPayload): Promise<PushDeliveryResult>;
  sendToAll(payload: PushPayload): Promise<PushDeliveryResult>;
}

interface PushDeliveryDeps {
  fetchSubscriptions?: (
    userId?: string,
  ) => Promise<{ endpoint: string; auth: string; p256dh: string }[]>;
  sendToSubscription?: (
    sub: { endpoint: string; auth: string; p256dh: string },
    payload: PushPayload,
  ) => Promise<boolean>;
}

let vapidInitPromise: Promise<void> | null = null;

function ensureVapid(): Promise<void> {
  if (vapidInitPromise) return vapidInitPromise;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) {
    vapidInitPromise = Promise.resolve();
    return vapidInitPromise;
  }
  vapidInitPromise = (async () => {
    const { default: webpush } = await import("web-push");
    webpush.setVapidDetails("mailto:study@lumni.app", pub, priv);
  })();
  return vapidInitPromise;
}

async function webPushSend(
  sub: { endpoint: string; auth: string; p256dh: string },
  payload: PushPayload,
): Promise<boolean> {
  try {
    const { default: webpush } = await import("web-push");
    await ensureVapid();
    const subscription = {
      endpoint: sub.endpoint,
      keys: { auth: sub.auth, p256dh: sub.p256dh },
    };
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url ?? "/dashboard",
      }),
    );
    return true;
  } catch {
    return false;
  }
}

async function fetchAllSubscriptions(): Promise<
  { endpoint: string; auth: string; p256dh: string }[]
> {
  try {
    const [{ databases }, { APPWRITE_DATABASE_ID }] = await Promise.all([
      import("@/lib/appwrite.server"),
      import("@/lib/db/client"),
    ]);
    const docs = await databases.listDocuments(APPWRITE_DATABASE_ID, "push_subscriptions");
    return docs.documents.map((sub: Record<string, unknown>) => ({
      endpoint: sub.endpoint as string,
      auth: sub.auth as string,
      p256dh: sub.p256dh as string,
    }));
  } catch {
    return [];
  }
}

async function fetchSubscriptionsByUser(
  userId: string,
): Promise<{ endpoint: string; auth: string; p256dh: string }[]> {
  try {
    const [{ Query }, { listDocuments }] = await Promise.all([
      import("appwrite"),
      import("@/lib/db/client"),
    ]);
    const docs = await listDocuments<{
      endpoint: string;
      auth: string;
      p256dh: string;
    }>("push_subscriptions", [Query.equal("userId", userId)]);
    return docs;
  } catch {
    return [];
  }
}

export class PushDeliveryService implements PushDispatchPort {
  private deps: PushDeliveryDeps;

  constructor(deps?: PushDeliveryDeps) {
    this.deps = deps ?? {};
    ensureVapid();
  }

  async sendToUser(userId: string, payload: PushPayload): Promise<PushDeliveryResult> {
    const fetchFn = this.deps.fetchSubscriptions ?? fetchSubscriptionsByUser;
    const sendFn = this.deps.sendToSubscription ?? webPushSend;
    const subs = await fetchFn(userId);
    if (subs.length === 0) return { sent: 0, total: 0 };

    const results = await Promise.allSettled(subs.map((sub) => sendFn(sub, payload)));
    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    return { sent, total: subs.length };
  }

  async sendToAll(payload: PushPayload): Promise<PushDeliveryResult> {
    const fetchFn = this.deps.fetchSubscriptions ?? fetchAllSubscriptions;
    const sendFn = this.deps.sendToSubscription ?? webPushSend;
    const subs = await fetchFn();
    if (subs.length === 0) return { sent: 0, total: 0 };

    const results = await Promise.allSettled(subs.map((sub) => sendFn(sub, payload)));
    const sent = results.filter((r) => r.status === "fulfilled" && r.value).length;
    return { sent, total: subs.length };
  }
}
