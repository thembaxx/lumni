export interface PushPayload {
	title: string;
	body: string;
	url?: string;
}

export interface PushDeliveryResult {
	sent: number;
	total: number;
}

interface PushDeliveryDeps {
	fetchSubscriptions?: (
		userId?: string,
	) => Promise<{ endpoint: string; auth: string; p256dh: string }[]>;
}

let vapidConfigured = false;

function ensureVapid() {
	if (vapidConfigured) return;
	const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
	const priv = process.env.VAPID_PRIVATE_KEY;
	if (!pub || !priv) return;
	// Lazy import to avoid bundling web-push on client
	void import("web-push").then(({ default: webpush }) => {
		webpush.setVapidDetails("mailto:study@lumni.app", pub, priv);
		vapidConfigured = true;
	});
}

async function sendToSubscription(
	sub: { endpoint: string; auth: string; p256dh: string },
	payload: PushPayload,
): Promise<boolean> {
	try {
		const { default: webpush } = await import("web-push");
		if (!vapidConfigured) ensureVapid();
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
		const { databases } = await import("@/lib/appwrite.server");
		const { APPWRITE_DATABASE_ID } = await import("@/lib/db/client");
		const docs = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			"push_subscriptions",
		);
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
		const { Query } = await import("appwrite");
		const { listDocuments } = await import("@/lib/db/client");
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

export class PushDeliveryService {
	private deps: PushDeliveryDeps;

	constructor(deps?: PushDeliveryDeps) {
		this.deps = deps ?? {
			fetchSubscriptions: undefined,
		};
		ensureVapid();
	}

	async sendToUser(
		userId: string,
		payload: PushPayload,
	): Promise<PushDeliveryResult> {
		const fetchFn = this.deps.fetchSubscriptions ?? fetchSubscriptionsByUser;
		const subs = await fetchFn(userId);
		if (subs.length === 0) return { sent: 0, total: 0 };

		const results = await Promise.allSettled(
			subs.map((sub) => sendToSubscription(sub, payload)),
		);
		const sent = results.filter(
			(r) => r.status === "fulfilled" && r.value,
		).length;
		return { sent, total: subs.length };
	}

	async sendToAll(payload: PushPayload): Promise<PushDeliveryResult> {
		const fetchFn = this.deps.fetchSubscriptions ?? fetchAllSubscriptions;
		const subs = await fetchFn();
		if (subs.length === 0) return { sent: 0, total: 0 };

		const results = await Promise.allSettled(
			subs.map((sub) => sendToSubscription(sub, payload)),
		);
		const sent = results.filter(
			(r) => r.status === "fulfilled" && r.value,
		).length;
		return { sent, total: subs.length };
	}
}
