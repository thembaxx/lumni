import { trackEngineEvent } from "@/lib/utils/engine-analytics";

export class AnalyticsService {
	track(
		event: "generate" | "grade" | "hint" | "validate",
		data: {
			subject?: string;
			questionType?: string;
			count?: number;
			success: boolean;
		},
	): void {
		trackEngineEvent({ event, ...data });
	}

	async getComparativeAnalytics(userId: string): Promise<{
		userPercentile: number;
		subjectRankings: Record<string, number>;
		globalAverage: number;
		userAverage: number;
	}> {
		const attempts = await Promise.allSettled(
			[1, 2].map(async (attempt) => {
				try {
					const res = await fetch(
						`/api/analytics/comparative?userId=${encodeURIComponent(userId)}`,
					);
					if (!res.ok) throw new Error(`HTTP ${res.status}`);
					return await res.json();
				} catch (error) {
					if (attempt < 2) {
						await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
					}
					throw error;
				}
			}),
		);
		const fulfilled = attempts.find(
			(r): r is PromiseFulfilledResult<{
				userPercentile: number;
				subjectRankings: Record<string, number>;
				globalAverage: number;
				userAverage: number;
			}> => r.status === "fulfilled",
		);
		if (fulfilled) return fulfilled.value;

		const lastError =
			(attempts.find((r): r is PromiseRejectedResult => r.status === "rejected")?.reason as Error | undefined) ??
			null;
		console.error(
			"Failed to get comparative analytics after retries:",
			lastError,
		);
		return {
			userPercentile: 50,
			subjectRankings: {},
			globalAverage: 65,
			userAverage: 0,
		};
	}

	async getSubjectTrend(
		userId: string,
		subject: string,
	): Promise<{
		dates: string[];
		accuracies: number[];
		trend: "improving" | "declining" | "stable";
	}> {
		try {
			const res = await fetch(
				`/api/analytics/trends?userId=${encodeURIComponent(userId)}&subject=${encodeURIComponent(subject)}`,
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (error) {
			console.error("Failed to get subject trend:", error);
			return { dates: [], accuracies: [], trend: "stable" };
		}
	}
}

export const analyticsService = new AnalyticsService();
