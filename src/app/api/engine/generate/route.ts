import { NextRequest, NextResponse } from "next/server";
import { LearningOrchestrator } from "@/lib/orchestrator";
import type { GenerationParams } from "@/lib/question-engine/types";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

export const POST = withRateLimit(async (req: NextRequest) => {
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

		return NextResponse.json({
			questions: result.questions,
			count: result.count,
			type: body.questionType || "any",
			jobIds: result.jobIds,
		});
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
});
