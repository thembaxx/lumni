"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { startViewTransition as svt } from "@/lib/utils/view-transition";

const navHierarchy: Record<string, number> = {
	"/dashboard": 0,
	"/quiz": 1,
	"/flashcards": 1,
	"/admin": 1,
};

export function useNavigationDirection() {
	const router = useRouter();

	const push = useCallback(
		(href: string) => {
			const currentDepth = navHierarchy[window.location.pathname] ?? 0;
			const targetDepth = navHierarchy[href] ?? currentDepth;
			const direction = targetDepth >= currentDepth ? "forward" : "back";

			document.documentElement.dataset.vtDirection = direction;

			svt(() => {
				router.push(href);
			});
		},
		[router],
	);

	const replace = useCallback(
		(href: string) => {
			const currentDepth = navHierarchy[window.location.pathname] ?? 0;
			const targetDepth = navHierarchy[href] ?? currentDepth;
			const direction = targetDepth >= currentDepth ? "forward" : "back";

			document.documentElement.dataset.vtDirection = direction;

			svt(() => {
				router.replace(href);
			});
		},
		[router],
	);

	return { push, replace };
}
