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
import { validateProgramming } from "../validators";

export class ProgrammingProcessor implements QuestionProcessor<"programming"> {
	readonly type = "programming" as const;
	private prompts = new PromptManager();

	async generate(params: GenerationParams): Promise<Question<"programming">[]> {
		const prompt = this.prompts.getPrompt("programming", params);
		const result = await getAI().generateWithSystem(
			prompt.system,
			prompt.user,
			{ temperature: 0.7, maxTokens: 4096 },
		);
		const parsed = parseAIResponse<Question<"programming">[]>(result, []);
		if (!parsed) throw new Error("AI generation failed");
		return ensureArray(parsed.data);
	}

	async generateHint(question: Question<"programming">): Promise<string> {
		return `Think about the algorithm first. Consider edge cases. The function should handle ${question.body.testCases.length} test case(s).`;
	}

	async grade(
		question: Question<"programming">,
		answer: UserAnswer,
	): Promise<GradingResult> {
		const code = answer.value as string;
		if (!code)
			return {
				correct: false,
				score: 0,
				maxScore: question.points,
				feedback: "No code submitted.",
			};
		const prompt = this.prompts.getGradePrompt("programming");
		const ctx = `Problem: ${question.questionText}\nLanguage: ${question.body.language}\nTest cases: ${JSON.stringify(question.body.testCases)}\nStudent code:\n${code}`;
		const result = await getAI().generateWithSystem(
			prompt.system,
			`${prompt.user}\n\n${ctx}`,
			{ temperature: 0.2, maxTokens: 1024 },
		);
		const parsed = parseAIResponse<{
			correct: boolean;
			score?: number;
			feedback?: string;
			breakdown?: GradingResult["breakdown"];
		}>(result, { correct: false });
		if (parsed) {
			return {
				correct: parsed.data.correct,
				score: parsed.data.score ?? 0,
				maxScore: question.points,
				feedback: parsed.data.feedback ?? "",
				breakdown: parsed.data.breakdown,
			};
		}
		return {
			correct: false,
			score: 0,
			maxScore: question.points,
			feedback: "Unable to evaluate code.",
		};
	}

	validate(question: Question<"programming">): ValidationResult {
		return validateProgramming(question);
	}
}
