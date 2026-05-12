import { NextRequest, NextResponse } from "next/server";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { GenerationParams } from "@/lib/question-engine/types";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0] ||
		req.headers.get("x-real-ip") ||
		"unknown";

	const rateLimit = checkRateLimit(ip);

	if (!rateLimit.allowed) {
		return NextResponse.json(
			{ error: "Rate limit exceeded" },
			{ status: 429, headers: getRateLimitHeaders(rateLimit) },
		);
	}

	try {
		const body = (await req.json()) as GenerationParams;

		if (!body.subject) {
			return NextResponse.json(
				{ error: "Subject is required" },
				{ status: 400 },
			);
		}

		if (!body.count || body.count < 1) {
			return NextResponse.json(
				{ error: "Count must be at least 1" },
				{ status: 400 },
			);
		}

		const orchestrator = await LearningOrchestrator.initialize();
		const result = await orchestrator.generateQuestionSet(body);

		return NextResponse.json(
			{
				questions: result.questions,
				count: result.count,
				type: body.questionType || "any",
				jobIds: result.jobIds,
			},
			{ headers: getRateLimitHeaders(rateLimit) },
		);
	} catch (error) {
		console.error("[Engine Generate] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to generate questions",
			},
			{ status: 500 },
		);
	}
}
