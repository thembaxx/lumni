import { NextRequest, NextResponse } from "next/server";
import type { AICallType } from "@/lib/ai/token-tracker";
import { tokenTracker } from "@/lib/ai/token-tracker";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
	const userId =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip")?.trim() ||
		"anonymous";

	const usage = tokenTracker.getUsage(userId);
	const globalUsage = tokenTracker.getGlobalUsage();

	return NextResponse.json({
		user: { id: userId, usage },
		global: globalUsage,
	});
}
