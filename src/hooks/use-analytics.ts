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

	const refresh = useCallback(() => {
		setAnalytics(null);
		analyticsEngine.compute().then(setAnalytics);
	}, []);

	useEffect(() => {
		refresh();
	}, [refresh]);

	const isLoading = analytics === null;

	return {
		analytics,
		isLoading,
		refresh,
	};
}
