"use client";

import { useEffect, useState } from "react";

interface SessionUser {
	userId: string | null;
	name: string | null;
	email: string | null;
}

interface UseAppwriteSessionReturn {
	user: SessionUser;
	isLoading: boolean;
	isLoggedIn: boolean;
}

export function useAppwriteSession(): UseAppwriteSessionReturn {
	const [user, setUser] = useState<SessionUser>({
		userId: null,
		name: null,
		email: null,
	});
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;

		async function fetchSession() {
			try {
				const res = await fetch("/api/session");
				const data: SessionUser = await res.json();
				if (!cancelled) {
					setUser(data);
				}
			} catch {
				if (!cancelled) {
					setUser({ userId: null, name: null, email: null });
				}
			} finally {
				if (!cancelled) {
					setIsLoading(false);
				}
			}
		}

		fetchSession();

		return () => {
			cancelled = true;
		};
	}, []);

	return {
		user,
		isLoading,
		isLoggedIn: user.userId !== null,
	};
}
