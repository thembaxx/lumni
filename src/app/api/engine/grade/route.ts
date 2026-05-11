import { NextRequest, NextResponse } from "next/server";
import { QuestionEngine } from "@/lib/question-engine";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
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
		const { question, answer } = body as {
			question: Question;
			answer: UserAnswer;
		};

		if (!question || !answer) {
			return NextResponse.json(
				{ error: "Question and answer are required" },
				{ status: 400 },
			);
		}

		const engine = await QuestionEngine.initialize();
		const result = await engine.grade(question, answer);

		return NextResponse.json(result, {
			headers: getRateLimitHeaders(rateLimit),
		});
	} catch (error) {
		console.error("[Engine Grade] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to grade answer",
			},
			{ status: 500 },
		);
	}
}
