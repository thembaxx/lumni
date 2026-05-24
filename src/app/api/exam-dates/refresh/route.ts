import { NextResponse } from "next/server";
import { getSeedData, syncExamDatesToAppwrite } from "@/lib/exam-dates/service";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function refreshHandler(): Promise<NextResponse> {
	try {
		const sessions = [
			{ session: "may-june", year: 2026 },
			{ session: "oct-nov", year: 2026 },
		];

		const results = (
			await Promise.all(
				sessions.map(async ({ session, year }) => {
					const slots = getSeedData(session, year);
					if (slots.length > 0) {
						await syncExamDatesToAppwrite(session, year, slots);
						return { session, year, count: slots.length };
					}
					return null;
				}),
			)
		).filter((r): r is { session: string; year: number; count: number } => r !== null);

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
