"use client";

import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
	threshold?: number;
	rootMargin?: string;
	once?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
	options: UseScrollRevealOptions = {},
) {
	const {
		threshold: _threshold = 0,
		rootMargin = "-48px 0px -48px 0px",
		once = false,
	} = options;
	const ref = useRef<T>(null);
	const [progress, setProgress] = useState(0);
	const [hasRevealed, setHasRevealed] = useState(false);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					const p = Math.min(1, Math.max(0, entry.intersectionRatio));
					setProgress(p);
					if (p > 0.15) {
						setHasRevealed(true);
						if (once) {
							observer.unobserve(el);
						}
					}
				}
			},
			{
				threshold: buildThresholds(20),
				rootMargin,
			},
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, [rootMargin, once]);

	return { ref, progress, isVisible: progress > 0, hasRevealed };
}

function buildThresholds(steps: number): number[] {
	const thresholds: number[] = [];
	for (let i = 0; i <= steps; i++) {
		thresholds.push(i / steps);
	}
	return thresholds;
}
