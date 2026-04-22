"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";

function report(metric: { name: string; value: number }) {
	if (process.env.NODE_ENV === "development") {
		switch (metric.name) {
			case "FCP":
				console.log("First Contentful Paint:", metric.value);
				break;
			case "LCP":
				console.log("Largest Contentful Paint:", metric.value);
				break;
			case "CLS":
				console.log("Cumulative Layout Shift:", metric.value);
				break;
			case "INP":
				console.log("Interaction to Next Paint:", metric.value);
				break;
			case "TTFB":
				console.log("Time to First Byte:", metric.value);
				break;
			default:
				break;
		}
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
