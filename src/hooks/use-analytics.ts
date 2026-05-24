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
	const [isLoading, setIsLoading] = useState(true);

	const refresh = useCallback(() => {
		setIsLoading(true);
		analyticsEngine
			.compute()
			.then(setAnalytics)
			.finally(() => setIsLoading(false));
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	return {
		analytics,
		isLoading,
		refresh,
	};
}
