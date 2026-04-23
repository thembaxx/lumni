"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

function report(metric: { name: string; value: number }) {
	if (process.env.NODE_ENV !== "development") return;

	const shouldLog = Math.random() < 0.1;
	if (!shouldLog) return;

	switch (metric.name) {
		case "FCP":
			console.debug("First Contentful Paint:", metric.value);
			break;
		case "LCP":
			console.debug("Largest Contentful Paint:", metric.value);
			break;
		case "CLS":
			console.debug("Cumulative Layout Shift:", metric.value);
			break;
		case "INP":
			console.debug("Interaction to Next Paint:", metric.value);
			break;
		case "TTFB":
			console.debug("Time to First Byte:", metric.value);
			break;
		default:
			break;
	}
}

export function WebVitalsLogger() {
	useEffect(() => {
		if (typeof window === "undefined") return;
		onCLS(report);
		onFCP(report);
		onINP(report);
		onLCP(report);
		onTTFB(report);
	}, []);
	return null;
}
