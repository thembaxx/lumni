"use client";

import dynamic from "next/dynamic";
import { type ReactNode, useCallback, useRef, useState } from "react";
import {
	StaggeredSection,
	StaggerProvider,
} from "@/components/shared/stagger-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth/auth-context";

function LazySection({
	children,
	className,
}: {
	children: ReactNode;
	className?: string;
}) {
	const [isVisible, setIsVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	const setRef = useCallback((node: HTMLDivElement | null) => {
		(ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
		if (!node) return;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					setIsVisible(true);
					observer.disconnect();
				}
			},
			{ rootMargin: "200px" },
		);
		observer.observe(node);
	}, []);

	return (
		<div ref={setRef} className={className}>
			{isVisible ? children : <Skeleton className="h-48 rounded-4xl" />}
		</div>
	);
}

const ComparativeAnalyticsPanel = dynamic(
	() =>
		import("@/components/dashboard/analytics/comparative-analytics-panel").then(
			(mod) => mod.ComparativeAnalyticsPanel,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex h-64 items-center justify-center rounded-4xl border border-dashed bg-system-surface">
				<Skeleton className="h-full w-full rounded-4xl" />
			</div>
		),
	},
);

const StatsRow = dynamic(
	() => import("@/components/dashboard/stats-row").then((m) => m.StatsRow),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const LeaderboardCard = dynamic(
	() =>
		import("@/components/social/leaderboard-card").then(
			(m) => m.LeaderboardCard,
		),
	{ ssr: false, loading: () => <Skeleton className="h-48 rounded-4xl" /> },
);

const AchievementShowcase = dynamic(
	() =>
		import("@/components/dashboard/achievement-showcase").then(
			(m) => m.AchievementShowcase,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const RewardChestPanel = dynamic(
	() =>
		import("@/components/gamification/reward-chest/reward-chest-panel").then(
			(m) => m.RewardChestPanel,
		),
	{ ssr: false, loading: () => <Skeleton className="h-32 rounded-4xl" /> },
);

const MasteryHeatmap = dynamic(
	() =>
		import("@/components/dashboard/mastery-heatmap").then(
			(m) => m.MasteryHeatmap,
		),
	{ ssr: false, loading: () => <Skeleton className="h-48 rounded-4xl" /> },
);

export function AnalyticsTab() {
	const { user } = useAuth();
	const isLoggedIn = !!user;

	if (!isLoggedIn) return null;

	return (
		<StaggerProvider baseDelay={0.02}>
			<StaggeredSection>
				<ComparativeAnalyticsPanel />
			</StaggeredSection>
			<StaggeredSection>
				<StatsRow />
			</StaggeredSection>
			<StaggeredSection>
				<LazySection>
					<LeaderboardCard />
				</LazySection>
			</StaggeredSection>
			<StaggeredSection>
				<AchievementShowcase />
			</StaggeredSection>
			<StaggeredSection>
				<RewardChestPanel />
			</StaggeredSection>
			<StaggeredSection>
				<LazySection>
					<Card>
						<CardHeader>
							<CardTitle className="font-extrabold text-base tracking-tight">
								Mastery Heatmap
							</CardTitle>
						</CardHeader>
						<CardContent>
							<MasteryHeatmap />
						</CardContent>
					</Card>
				</LazySection>
			</StaggeredSection>
		</StaggerProvider>
	);
}
