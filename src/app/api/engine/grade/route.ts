import { NextRequest, NextResponse } from "next/server";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { Question, UserAnswer } from "@/lib/question-engine/types";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

export const POST = withRateLimit(async (req: NextRequest) => {
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

		const orchestrator = await LearningOrchestrator.initialize();
		const { result, jobIds } = await orchestrator.gradeAndTrack(
			question,
			answer,
		);

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
