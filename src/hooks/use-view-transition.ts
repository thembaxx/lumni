"use client";

import { useCallback, useRef } from "react";
import { startViewTransition as svt } from "@/lib/utils/view-transition";

export function useViewTransition() {
	const pendingRef = useRef(false);

	const startViewTransition = useCallback((callback: () => void) => {
		if (pendingRef.current) return;
		pendingRef.current = true;

		const transition = svt(() => {
			return new Promise<void>((resolve) => {
				callback();
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						resolve();
					});
				});
			});
		});

		if (transition) {
			transition.finished.finally(() => {
				pendingRef.current = false;
			});
		} else {
			callback();
			pendingRef.current = false;
		}
	}, []);

	return { startViewTransition };
}
