"use client";

import { useCallback, useEffect, useState } from "react";

const PUSH_SUBSCRIPTION_KEY = "lumni_push_subscription";

interface PushSubscriptionJSON {
	endpoint: string;
	keys: {
		p256dh: string;
		auth: string;
	};
}

export function usePushNotifications() {
	const [permission, setPermission] =
		useState<NotificationPermission>("default");
	const [isSubscribed, setIsSubscribed] = useState(false);
	const [isSupported, setIsSupported] = useState(false);

	useEffect(() => {
		if (!("Notification" in window) || !("PushManager" in window)) {
			setIsSupported(false);
			return;
		}
		setIsSupported(true);
		setPermission(Notification.permission);

		const stored = localStorage.getItem(PUSH_SUBSCRIPTION_KEY);
		if (stored) setIsSubscribed(true);
	}, []);

	const subscribe = useCallback(async () => {
		if (!isSupported) return false;

		try {
			const reg = await navigator.serviceWorker.ready;
			let sub = await reg.pushManager.getSubscription();

			if (!sub) {
				const perm = await Notification.requestPermission();
				setPermission(perm);

				if (perm !== "granted") return false;

				sub = await reg.pushManager.subscribe({
					userVisibleOnly: true,
					applicationServerKey: null,
				});
			}

			const json = sub.toJSON() as unknown as PushSubscriptionJSON;
			localStorage.setItem(PUSH_SUBSCRIPTION_KEY, JSON.stringify(json));
			setIsSubscribed(true);
			return true;
		} catch {
			return false;
		}
	}, [isSupported]);

	const unsubscribe = useCallback(async () => {
		try {
			const reg = await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.getSubscription();
			if (sub) await sub.unsubscribe();
			localStorage.removeItem(PUSH_SUBSCRIPTION_KEY);
			setIsSubscribed(false);
			return true;
		} catch {
			return false;
		}
	}, []);

	return {
		permission,
		isSubscribed,
		isSupported,
		subscribe,
		unsubscribe,
	};
}
