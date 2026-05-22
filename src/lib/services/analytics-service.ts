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
			const batchPromises = [];
			for (let i = 0; i < events.length; i += batchSize) {
				const batch = events.slice(i, i + batchSize);
				batchPromises.push(
					Promise.allSettled(
						batch.map((event) =>
							databases
								.createDocument(APPWRITE_DATABASE_ID, "analytics", "unique()", {
									event: JSON.stringify(event),
									createdAt: new Date().toISOString(),
								})
								.catch((e) => console.warn("Analytics write failed:", e)),
						),
					),
				);
			}
			await Promise.all(batchPromises);
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
		let lastError: Error | null = null;
		for (let attempt = 1; attempt <= 2; attempt++) {
			try {
				const res = await fetch(
					`/api/analytics/comparative?userId=${encodeURIComponent(userId)}`,
				);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				return await res.json();
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));
				if (attempt < 2) {
					await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
				}
			}
		}

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
