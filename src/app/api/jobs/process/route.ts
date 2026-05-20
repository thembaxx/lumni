import { type NextRequest, NextResponse } from "next/server";
import { jobProcessor } from "@/lib/orchestrator/job-processor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const raw = await req.json().catch(() => null);
		if (!raw || typeof raw !== "object") {
			return NextResponse.json(
				{ error: "Invalid request body" },
				{ status: 400 },
			);
		}
		const body = raw as Record<string, unknown>;
		const limit =
			typeof body.limit === "number" && body.limit > 0
				? Math.min(body.limit, 50)
				: 5;

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
