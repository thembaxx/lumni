import { type NextRequest, NextResponse } from "next/server";
import { cleanupOldQuestions } from "@/lib/db/cleanup";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

async function cleanupHandler(req: NextRequest) {
	const cronSecret = req.headers.get("x-cron-secret");
	if (cronSecret !== process.env.CRON_SECRET) {
		const { requireAdmin } = await import("@/lib/server/auth");
		await requireAdmin();
	}

	try {
		const result = await cleanupOldQuestions();
		return NextResponse.json(result);
	} catch (error) {
		console.error("[Cron Cleanup] Error:", error);
		return NextResponse.json(
			{
				deleted: 0,
				remaining: 0,
				error: error instanceof Error ? error.message : "Cleanup failed",
			},
			{ status: 500 },
		);
	}
}

export const GET = withRateLimit(cleanupHandler, {
	max: 1,
	windowMs: 60000,
});

export const POST = withRateLimit(cleanupHandler, {
	max: 1,
	windowMs: 60000,
});
