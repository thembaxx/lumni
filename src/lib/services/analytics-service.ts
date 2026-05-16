import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";
import { safePersist } from "@/lib/db/persist";
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
	 */
	async getComparativeAnalytics(userId: string): Promise<{
		userPercentile: number;
		subjectRankings: Record<string, number>;
		globalAverage: number;
		userAverage: number;
	}> {
		try {
			const res = await fetch(
				`/api/analytics/comparative?userId=${encodeURIComponent(userId)}`,
			);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			return await res.json();
		} catch (error) {
			console.error("Failed to get comparative analytics:", error);
			return {
				userPercentile: 50,
				subjectRankings: {},
				globalAverage: 65,
				userAverage: 0,
			};
		}
	}

	/**
	 * Get trends over time for subject performance
	 */
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
