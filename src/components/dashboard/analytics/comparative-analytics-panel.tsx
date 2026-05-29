"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAnalytics } from "@/hooks/use-analytics";
import { useAuth } from "@/lib/auth/auth-context";
import { usePremium } from "@/lib/premium/premium-context";
import { analyticsService } from "@/lib/services/analytics-service";
import { AnalyticsEmptyState } from "./comparative-analytics-panel/analytics-empty-state";
import { PerformanceTrendsSection } from "./comparative-analytics-panel/performance-trends-section";
import { PremiumGate } from "./comparative-analytics-panel/premium-gate";
import { SubjectRankingsChart } from "./comparative-analytics-panel/subject-rankings-chart";
import { UserPercentileCard } from "./comparative-analytics-panel/user-percentile-card";

interface SubjectTrendData {
	dates: string[];
	accuracies: number[];
	trend: "improving" | "declining" | "stable";
}

export function ComparativeAnalyticsPanel() {
	const { hasFeature } = usePremium();
	const { analytics, isLoading } = useAnalytics();
	const { user } = useAuth();

	const comparativeQuery = useQuery({
		queryKey: ["comparative-analytics", user?.$id],
		queryFn: () => analyticsService.getComparativeAnalytics(user?.$id ?? ""),
		enabled: !!user?.$id && !!analytics && !isLoading,
		staleTime: 5 * 60 * 1000,
	});

	const comparativeData = comparativeQuery.data ?? null;

	const weakSubjects = useMemo(() => {
		if (!comparativeData) return [];
		return Object.entries(comparativeData.subjectRankings)
			.sort(([, rankA], [, rankB]) => rankA - rankB)
			.slice(0, 3)
			.map(([subject]) => subject);
	}, [comparativeData]);

	const trendsQuery = useQuery({
		queryKey: ["subject-trends", user?.$id, ...weakSubjects.sort()],
		queryFn: async () => {
			const trends: Record<string, SubjectTrendData> = {};
			await Promise.all(
				weakSubjects.map(async (subject) => {
					const data = await analyticsService.getSubjectTrend(
						user?.$id ?? "",
						subject,
					);
					trends[subject] = data;
				}),
			);
			return trends;
		},
		enabled: weakSubjects.length > 0 && !!user?.$id,
		staleTime: 5 * 60 * 1000,
	});

	const subjectTrends = trendsQuery.data ?? {};

	if (!hasFeature("advanced-analytics")) {
		return <PremiumGate />;
	}

	if (isLoading || !analytics) {
		return (
			<div className="flex items-center justify-center p-8">
				<div className="size-8 animate-spin rounded-full border-foreground border-b-2" />
			</div>
		);
	}

	if (!analytics || analytics.totalQuestions === 0) {
		return <AnalyticsEmptyState />;
	}

	return (
		<div className="flex flex-col gap-8 pt-6">
			{comparativeData && (
				<UserPercentileCard
					userPercentile={comparativeData.userPercentile}
					globalAverage={comparativeData.globalAverage}
					userAverage={comparativeData.userAverage}
				/>
			)}

			{comparativeData &&
				Object.keys(comparativeData.subjectRankings).length > 0 && (
					<SubjectRankingsChart
						subjectRankings={comparativeData.subjectRankings}
						userAverage={comparativeData.userAverage}
					/>
				)}

			<PerformanceTrendsSection subjectTrends={subjectTrends} />
		</div>
	);
}
