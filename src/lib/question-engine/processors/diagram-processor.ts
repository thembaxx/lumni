import { getAI } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import { ensureArray, parseAIResponse } from "../parse-response";
import { PromptManager } from "../prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	Question,
	QuestionProcessor,
	UserAnswer,
	ValidationResult,
} from "../types";
import { validateDiagram } from "../validators";

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
		const parsed = parseAIResponse<Question<"diagram">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
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
		const parsed = parseAIResponse<{
			correct: boolean;
			score?: number;
			feedback?: string;
		}>(result, { correct: false });
		if (parsed) {
			return {
				correct: parsed.data.correct,
				score: parsed.data.score ?? 0,
				maxScore: question.points,
				feedback: parsed.data.feedback ?? question.explanation,
			};
		}
		return {
			correct: false,
			score: 0,
			maxScore: question.points,
			feedback: question.explanation,
		};
	}

	validate(question: Question<"diagram">): ValidationResult {
		return validateDiagram(question);
	}
}
