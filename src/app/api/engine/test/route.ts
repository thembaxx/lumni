import { NextRequest, NextResponse } from "next/server";
import { QuestionEngine } from "@/lib/question-engine";
import type { GradingResult, Question } from "@/lib/question-engine/types";

export const dynamic = "force-dynamic";

export async function GET() {
	const results: Record<string, unknown> = {
		timestamp: new Date().toISOString(),
		steps: [] as string[],
		errors: [] as string[],
	};

	const addStep = (msg: string) => (results.steps as string[]).push(msg);
	const addError = (msg: string) => (results.errors as string[]).push(msg);

	try {
		addStep("Initializing engine...");
		const engine = await QuestionEngine.initialize();
		addStep("Engine initialized");

		addStep("Generating 2 multiple-choice questions for 'mathematics'...");
		const questions = await engine.generate({
			subject: "mathematics",
			topic: "algebra",
			count: 2,
			questionType: "multiple-choice",
			difficulty: "Easy",
		});
		addStep(`Generated ${questions.length} questions`);

		if (questions.length === 0) {
			addError("No questions generated");
			return NextResponse.json(
				{ ...results, status: "partial_failure" },
				{ status: 500 },
			);
		}

		const q = questions[0] as Question<"multiple-choice">;
		addStep(
			`Question 1 type: ${q.type}, text: "${q.questionText.slice(0, 60)}..."`,
		);

		addStep("Testing validation...");
		const validation = engine.validate(q);
		addStep(
			`Validation score: ${validation.score}, isValid: ${validation.isValid}`,
		);

		addStep("Testing hint generation...");
		const hint = await engine.generateHint({ questionId: q.id, question: q });
		addStep(`Hint generated: "${hint.slice(0, 80)}..."`);

		addStep("Testing grading...");
		const correctAnswer = q.body.options.find((o) => o.isCorrect);
		if (correctAnswer) {
			const gradeResult = await engine.grade(q, {
				type: "option-ids",
				value: [correctAnswer.id],
			});
			addStep(
				`Grade result - correct: ${gradeResult.correct}, score: ${gradeResult.score}/${q.points}`,
			);
		}

		addStep("Testing type listing...");
		const types = engine.listTypes();
		addStep(`Available types: ${types.join(", ")}`);

		addStep("All tests passed");
		results.status = "success";
	} catch (error) {
		addError(
			`Fatal error: ${error instanceof Error ? error.message : String(error)}`,
		);
		results.status = "failure";
	}

	return NextResponse.json(results);
}
