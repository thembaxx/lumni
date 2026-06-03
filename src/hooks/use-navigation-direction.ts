"use client";

import { useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { getNavHierarchy } from "@/lib/navigation/config";
import { startViewTransition as svt } from "@/lib/utils/view-transition";

const navHierarchy = getNavHierarchy();

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
