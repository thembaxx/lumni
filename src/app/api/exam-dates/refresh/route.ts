import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/shared/with-rate-limit";
import { getSeedData, syncExamDatesToAppwrite } from "@/lib/exam-dates/service";

async function refreshHandler(): Promise<NextResponse> {
	try {
		const sessions = [
			{ session: "may-june", year: 2026 },
			{ session: "oct-nov", year: 2026 },
		];

		const results: { session: string; year: number; count: number }[] = [];

		for (const { session, year } of sessions) {
			const slots = getSeedData(session, year);
			if (slots.length > 0) {
				await syncExamDatesToAppwrite(session, year, slots);
				results.push({ session, year, count: slots.length });
			}
		}

		return NextResponse.json({
			success: true,
			refreshed: results,
			updatedAt: new Date().toISOString(),
		});
	} catch (error) {
		console.error("[exam-dates/refresh] Error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Refresh failed",
			},
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(refreshHandler, {
	max: 5,
	windowMs: 60 * 1000,
});
