import { NextRequest, NextResponse } from "next/server";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

export const POST = withRateLimit(async (req: NextRequest) => {
	try {
		const budget = await checkBudget(req, "grade");
		if (!budget.allowed) return budget.response!;

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

		const orchestrator = await LearningOrchestrator.initialize();
		const { result, jobIds } = await orchestrator.gradeAndTrack(
			question,
			answer,
		);

		trackUsage("grade", budget.userId);

		return NextResponse.json({ ...result, jobIds });
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
});
