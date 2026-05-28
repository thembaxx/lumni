"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import { startViewTransition as svt } from "@/lib/utils/view-transition";

type TransitionDirection = "forward" | "back";

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
	const directionRef = useRef<TransitionDirection>("forward");

	const push = useCallback(
		(href: string) => {
			const currentDepth = navHierarchy[window.location.pathname] ?? 0;
			const targetDepth = navHierarchy[href] ?? currentDepth;

			const direction: TransitionDirection =
				targetDepth >= currentDepth ? "forward" : "back";
			directionRef.current = direction;

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

			const direction: TransitionDirection =
				targetDepth >= currentDepth ? "forward" : "back";
			directionRef.current = direction;

			document.documentElement.dataset.vtDirection = direction;

			svt(() => {
				router.replace(href);
			});
		},
		[router],
	);

	const getDirection = useCallback(() => {
		return directionRef.current;
	}, []);

	return { push, replace, getDirection };
}
