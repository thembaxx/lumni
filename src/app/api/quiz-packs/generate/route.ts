import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

async function generateHandler(req: Request): Promise<NextResponse> {
	try {
		const body = await req.json();
		const { packId, subject, topic, count } = body;

		if (!packId || !subject || !count) {
			return NextResponse.json(
				{ error: "packId, subject, and count are required" },
				{ status: 400 },
			);
		}

		const { QuestionEngine } = await import(
			"@/lib/question-engine/question-engine"
		);
		const { quizPackService } = await import("@/lib/quiz-packs");

		const engine = await QuestionEngine.initialize();
		const topicParam = topic && typeof topic === "string" ? topic : undefined;

		const questions = await engine.generate({
			subject,
			topic: topicParam,
			count: Math.min(count, 20),
			questionType: "any",
		});

		const questionData = questions.map(
			(q: { questionText: string; options?: unknown[]; correctAnswer?: string; explanation?: string; difficulty?: string; type: string }, i: number) => ({
				questionIndex: i,
				questionText: q.questionText,
				options: q.options ? JSON.stringify(q.options) : null,
				correctAnswer: q.correctAnswer ?? "",
				explanation: q.explanation ?? null,
				difficulty: q.difficulty ?? "Medium",
				type: q.type,
			}),
		);

		await quizPackService.storeQuestions(packId, questionData);

		const storageBytes = new TextEncoder().encode(JSON.stringify(questionData))
			.length;

		return NextResponse.json({ success: true, storageBytes });
	} catch (error) {
		console.error("[quiz-packs/generate] Error:", error);
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
