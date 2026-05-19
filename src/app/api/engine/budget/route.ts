import { type NextRequest, NextResponse } from "next/server";
import { dailyCallTracker } from "@/lib/ai/daily-call-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	try {
		const userId =
			req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			req.headers.get("x-real-ip")?.trim() ||
			"anonymous";

		const usage = await dailyCallTracker.getUsage(userId);
		const globalUsage = await dailyCallTracker.getGlobalUsage();

		return NextResponse.json({
			user: { id: userId, usage },
			global: globalUsage,
		});
	} catch (error) {
		console.error("[/api/engine/budget] Error:", error);
		return NextResponse.json(
			{ error: "Failed to get budget info" },
			{ status: 500 },
		);
	}
}
