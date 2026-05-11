import { NextRequest, NextResponse } from "next/server";
import { QuestionEngine } from "@/lib/question-engine";
import type { Question } from "@/lib/question-engine/types";
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
		const body = await req.json();
		const { question } = body as { question: Question };

		if (!question || !question.id) {
			return NextResponse.json(
				{ error: "Question is required" },
				{ status: 400 },
			);
		}

		const engine = await QuestionEngine.initialize();
		const hint = await engine.generateHint({
			questionId: question.id,
			question,
		});

		return NextResponse.json(
			{ hint },
			{ headers: getRateLimitHeaders(rateLimit) },
		);
	} catch (error) {
		console.error("[Engine Hint] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to generate hint",
			},
			{ status: 500 },
		);
	}
}
