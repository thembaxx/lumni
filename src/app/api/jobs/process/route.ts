import { NextRequest, NextResponse } from "next/server";
import { jobProcessor } from "@/lib/orchestrator/job-processor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => ({}));
		const limit = typeof body.limit === "number" ? body.limit : 5;

		const result = await jobProcessor.processBatch(limit);

		return NextResponse.json(result);
	} catch (error) {
		console.error("[Jobs Process] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to process jobs",
			},
			{ status: 500 },
		);
	}
}
