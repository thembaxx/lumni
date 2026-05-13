"use client";

import { useCallback, useRef } from "react";

export function useViewTransition() {
	const pendingRef = useRef(false);

	const startViewTransition = useCallback(
		(callback: () => void) => {
			if (pendingRef.current) return;
			pendingRef.current = true;

			if (typeof document !== "undefined" && document.startViewTransition) {
				const transition = document.startViewTransition(() => {
					return new Promise<void>((resolve) => {
						callback();
						requestAnimationFrame(() => {
							requestAnimationFrame(() => {
								resolve();
							});
						});
					});
				});

				transition.finished.finally(() => {
					pendingRef.current = false;
				});
			} else {
				callback();
				pendingRef.current = false;
			}
		},
		[],
	);

	return { startViewTransition };
}
