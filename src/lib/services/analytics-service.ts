import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
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
		try {
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
		} catch {
			/* analytics sync is non-critical */
		}
	}
}

export const analyticsService = new AnalyticsService();
