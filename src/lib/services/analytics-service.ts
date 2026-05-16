import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { safePersist } from "@/lib/db/persist";
import {
	getAnalyticsSummary,
	trackEngineEvent,
} from "@/lib/utils/engine-analytics";

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

	async sync(events: unknown[]): Promise<void> {
		await safePersist("analytics sync", async () => {
			const batchSize = 50;
			for (let i = 0; i < events.length; i += batchSize) {
				const batch = events.slice(i, i + batchSize);
				const promises = batch.map((event) =>
					databases
						.createDocument(APPWRITE_DATABASE_ID, "analytics", "unique()", {
							event: JSON.stringify(event),
							createdAt: new Date().toISOString(),
						})
						.catch(() => {}),
				);
				await Promise.allSettled(promises);
			}
		});
	}

	/**
	 * Get comparative analytics compared to other users (anonymized)
	 * @returns Promise with comparative data
	 */
	async getComparativeAnalytics(): Promise<{
		userPercentile: number;
		subjectRankings: Record<string, number>;
		globalAverage: number;
		userAverage: number;
	}> {
		try {
			// Get local user analytics
			const userAnalytics = getAnalyticsSummary();

			// In a real implementation, we would fetch aggregated anonymous data from the server
			// For now, we'll simulate with some reasonable defaults
			// TODO: Replace with actual server call when backend endpoint is available

			// Simulated data - in reality this would come from an API endpoint
			const simulatedGlobalAverage = 65;
			const simulatedUserPercentile = Math.min(
				99,
				Math.max(1, Math.round(userAnalytics.successRate * 0.8 + 20)),
			);

			const subjectRankings: Record<string, number> = {};
			Object.keys(userAnalytics.bySubject).forEach((subject) => {
				const subjectSuccessRate = Math.min(
					100,
					userAnalytics.bySubject[subject],
				);
				subjectRankings[subject] = Math.min(
					99,
					Math.max(
						1,
						Math.round((subjectSuccessRate / simulatedGlobalAverage) * 50),
					),
				);
			});

			return {
				userPercentile: simulatedUserPercentile,
				subjectRankings,
				globalAverage: simulatedGlobalAverage,
				userAverage: userAnalytics.successRate,
			};
		} catch (error) {
			console.error("Failed to get comparative analytics:", error);
			// Return default values on error
			return {
				userPercentile: 50,
				subjectRankings: {},
				globalAverage: 65,
				userAverage: 0,
			};
		}
	}

	/**
   - Get trends over time for subject performance
   * @param subject Subject to analyze
   * @returns Promise with trend data
   */
	async getSubjectTrend(subject: string): Promise<{
		dates: string[];
		accuracies: number[];
		trend: "improving" | "declining" | "stable";
	}> {
		try {
			// In a real implementation, we would fetch time-series data from Appwrite or analytics storage
			// For now, return empty trend data
			return {
				dates: [],
				accuracies: [],
				trend: "stable",
			};
		} catch (error) {
			console.error("Failed to get subject trend:", error);
			return {
				dates: [],
				accuracies: [],
				trend: "stable",
			};
		}
	}
}

export const analyticsService = new AnalyticsService();
