import { NextResponse } from "next/server";
import type { Question } from "@/lib/question-engine/types";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { safeJsonStringify } from "@/lib/shared/json";
import { logError } from "@/lib/shared/logger";
import { extractCorrectAnswer } from "@/lib/shared/question-utils";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function generateHandler(req: Request): Promise<NextResponse> {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}
		const body = await req.json();
		const { packId, subject, topic, count } = body;

		if (!packId || !subject || !count) {
			return NextResponse.json(
				{ error: "packId, subject, and count are required" },
				{ status: 400 },
			);
		}

		const [{ QuestionEngine }, { quizPackService }] = await Promise.all([
			import("@/lib/question-engine/question-engine"),
			import("@/lib/quiz-packs"),
		]);

		const engine = await QuestionEngine.initialize();
		const topicParam = topic && typeof topic === "string" ? topic : undefined;

		const { questions } = await engine.generate({
			subject,
			topic: topicParam,
			count: Math.min(count, 20),
			questionType: "any",
		});

		const questionData = questions.map((q: Question, i: number) => ({
			questionIndex: i,
			questionText: q.questionText,
			options: safeJsonStringify("options" in q.body ? q.body.options : []),
			correctAnswer: extractCorrectAnswer(q) ?? "",
			explanation: q.explanation ?? null,
			difficulty: q.difficulty ?? "Medium",
			type: q.type,
		}));

		await quizPackService.storeQuestions(packId, questionData);

		const storageBytes = new TextEncoder().encode(
			JSON.stringify(questionData),
		).length;

		return NextResponse.json({ success: true, storageBytes });
	} catch (error) {
		logError("QuizPacksGenerate", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Generation failed" },
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(generateHandler, {
	max: 10,
	windowMs: 60 * 1000,
});
