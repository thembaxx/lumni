import { NextRequest, NextResponse } from "next/server";
import type { AICallType } from "@/lib/ai/daily-call-tracker";
import { dailyCallTracker } from "@/lib/ai/daily-call-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const userId =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip")?.trim() ||
		"anonymous";

	const usage = dailyCallTracker.getUsage(userId);
	const globalUsage = dailyCallTracker.getGlobalUsage();

	return NextResponse.json({
		user: { id: userId, usage },
		global: globalUsage,
	});
}
