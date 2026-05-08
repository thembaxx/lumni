"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

type TransitionDirection = "nav-forward" | "nav-back";

interface NavigationHierarchy {
	[href: string]: number;
}

const navHierarchy: NavigationHierarchy = {
	"/dashboard": 0,
	"/quiz": 1,
	"/flashcards": 1,
	"/admin": 1,
	"": 2,
};

export function useNavigationDirection() {
	const router = useRouter();

	const push = useCallback(
		(href: string) => {
			if (typeof window !== "undefined" && "startViewTransition" in document) {
				const currentDepth = navHierarchy[window.location.pathname] ?? 0;
				const targetDepth = navHierarchy[href] ?? currentDepth;

				const direction: TransitionDirection =
					targetDepth >= currentDepth ? "nav-forward" : "nav-back";

				router.push(href, { transitionTypes: [direction] });
			} else {
				router.push(href);
			}
		},
		[router],
	);

	const replace = useCallback(
		(href: string) => {
			if (typeof window !== "undefined" && "startViewTransition" in document) {
				const currentDepth = navHierarchy[window.location.pathname] ?? 0;
				const targetDepth = navHierarchy[href] ?? currentDepth;

				const direction: TransitionDirection =
					targetDepth >= currentDepth ? "nav-forward" : "nav-back";

				router.replace(href, { transitionTypes: [direction] });
			} else {
				router.replace(href);
			}
		},
		[router],
	);

	return { push, replace };
}
