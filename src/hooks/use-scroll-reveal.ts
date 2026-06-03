"use client";

import { useEffect, useRef, useState } from "react";

interface UseScrollRevealOptions {
	threshold?: number;
	rootMargin?: string;
	once?: boolean;
}

const DEFAULT_ROOT_MARGIN = "-48px 0px -48px 0px";
const THRESHOLD_STEPS = 20;
const REVEAL_THRESHOLD = 0.15;

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
	options: UseScrollRevealOptions = {},
) {
	const {
		threshold: _threshold = 0,
		rootMargin = DEFAULT_ROOT_MARGIN,
		once = false,
	} = options;
	const ref = useRef<T>(null);
	const onceRef = useRef(once);
	const rootMarginRef = useRef(rootMargin);
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
					if (p > REVEAL_THRESHOLD) {
						setHasRevealed(true);
						if (onceRef.current) {
							observer.unobserve(el);
						}
					}
				}
			},
			{
				threshold: buildThresholds(THRESHOLD_STEPS),
				rootMargin: rootMarginRef.current,
			},
		);

		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	return { ref, progress, isVisible: progress > 0, hasRevealed };
}

function buildThresholds(steps: number): number[] {
	const thresholds: number[] = [];
	for (let i = 0; i <= steps; i++) {
		thresholds.push(i / steps);
	}
	return thresholds;
}
