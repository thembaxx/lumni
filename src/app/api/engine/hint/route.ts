import { NextRequest, NextResponse } from "next/server";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { Question } from "@/lib/question-engine/types";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

export const POST = withRateLimit(async (req: NextRequest) => {
	try {
		const body = await req.json();
		const { question } = body as { question: Question };

		if (!question || !question.id) {
			return NextResponse.json(
				{ error: "Question is required" },
				{ status: 400 },
			);
		}

		const orchestrator = await LearningOrchestrator.initialize();
		const hint = await orchestrator.generateHint({
			questionId: question.id,
			question,
		});

		return NextResponse.json({ hint });
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
});
