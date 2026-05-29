"use client";

import { useCallback, useEffect, useState } from "react";
import type { OverallAnalytics } from "@/lib/analytics-engine";
import { analyticsEngine } from "@/lib/analytics-engine";

export type {
	AnalyticsRecommendation,
	OverallAnalytics,
	PerformanceHistoryItem,
	SubjectAnalytics,
	TopicPerformance,
} from "@/lib/analytics-engine";

export function useAnalytics() {
	const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
	const [hasLoaded, setHasLoaded] = useState(false);

	const refresh = useCallback(() => {
		setHasLoaded(false);
		analyticsEngine
			.compute()
			.then(setAnalytics)
			.finally(() => setHasLoaded(true));
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const isLoading = !hasLoaded;

	return {
		analytics,
		isLoading,
		refresh,
	};
}
