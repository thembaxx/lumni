import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import { PromptManager } from "../prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	Question,
	QuestionProcessor,
	UserAnswer,
	ValidationResult,
} from "../types";

export class DiagramProcessor implements QuestionProcessor<"diagram"> {
	readonly type = "diagram" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"diagram">[]> {
		const prompt = this.prompts.getPrompt("diagram", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.7, maxTokens: 4096 },
		);
		if ("available" in result && !result.available)
			throw new Error("AI generation failed");
		const parsed = JSON.parse(
			this.cleanResponse((result as AIResponse).content),
		) as Question<"diagram">[];
		return Array.isArray(parsed) ? parsed : [parsed];
	}

	async generateHint(question: Question<"diagram">): Promise<string> {
		return `Look carefully at the ${question.body.diagramData?.title || "diagram"} and identify the key elements requested in the instructions.`;
	}

	async grade(
		question: Question<"diagram">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const prompt = this.prompts.getGradePrompt("diagram");
		const ctx = `Question: ${question.questionText}\nDiagram: ${JSON.stringify(question.body.diagramData)}\nInstructions: ${question.body.instructions}\nStudent answer: ${JSON.stringify(answer.value)}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.2, maxTokens: 512 },
		);
		if ("available" in result && !result.available)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "Grading unavailable.",
			};
		try {
			const g = JSON.parse(this.cleanResponse((result as AIResponse).content));
			return {
				correct: g.correct,
				score: g.score,
				maxScore: question.points,
				feedback: g.feedback,
			};
		} catch {
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: question.explanation,
			};
		}
	}

	validate(question: Question<"diagram">): ValidationResult {
		const errors = [];
		if (!question.body.diagramData)
			errors.push({
				type: "schema" as const,
				field: "diagramData",
				message: "Diagram data required",
				severity: "error" as const,
			});
		return {
			isValid: errors.length === 0,
			errors,
			warnings: [],
			score: errors.length > 0 ? 0 : 100,
		};
	}

	private cleanResponse(content: string): string {
		return content
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();
	}
}
