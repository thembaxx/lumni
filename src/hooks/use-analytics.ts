"use client";

import { useCallback, useEffect, useState } from "react";
import { analyticsEngine } from "@/lib/analytics-engine";
import type {
	OverallAnalytics,
	AnalyticsRecommendation,
	SubjectAnalytics,
	TopicPerformance,
	PerformanceHistoryItem,
} from "@/lib/analytics-engine";

export type {
	OverallAnalytics,
	AnalyticsRecommendation,
	SubjectAnalytics,
	TopicPerformance,
	PerformanceHistoryItem,
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
