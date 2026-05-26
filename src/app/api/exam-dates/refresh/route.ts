import { NextResponse } from "next/server";
import { getSeedData, syncExamDatesDirect } from "@/lib/exam-dates/service";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function refreshHandler(): Promise<NextResponse> {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const sessions = [
			{ session: "may-june", year: 2026 },
			{ session: "oct-nov", year: 2026 },
		];

		const results = (
			await Promise.all(
				sessions.map(async ({ session, year }) => {
					const slots = getSeedData(session, year);
					if (slots.length > 0) {
						await syncExamDatesDirect(session, year, slots);
						return { session, year, count: slots.length };
					}
					return null;
				}),
			)
		).filter(
			(r): r is { session: string; year: number; count: number } => r !== null,
		);

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
