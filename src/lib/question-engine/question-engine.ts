import { initAI, isAIConfigured } from "@/lib/ai";
import { getCachedQuestions } from "@/lib/db/offline";
import { ProcessorRegistry } from "./processor-registry";
import { PromptManager } from "./prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	HintParams,
	Question,
	QuestionType,
	UserAnswer,
	ValidationResult,
} from "./types";

export class QuestionEngine {
	private registry: ProcessorRegistry;
	private prompts: PromptManager;

	constructor() {
		this.registry = new ProcessorRegistry();
		this.prompts = new PromptManager();
	}

	static async initialize(): Promise<QuestionEngine> {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
				deepseekApiKey: process.env.DEEPSEEK_API_KEY,
			});
		}
		return new QuestionEngine();
	}

	async generate(params: GenerationParams): Promise<Question[]> {
		const { questionType, count, subject, topic } = params;

		const cached = await getCachedQuestions(subject, topic);
		if (cached && cached.length >= count) {
			const shuffled = [...(cached as Question[])].sort(
				() => Math.random() - 0.5,
			);
			return shuffled.slice(0, count);
		}

		const { loadQuestionsFromAppwrite } = await import("./persistence");
		const appwriteQuestions = await loadQuestionsFromAppwrite(
			subject,
			topic,
			count,
		);
		if (appwriteQuestions.length >= count) {
			const shuffled = appwriteQuestions.sort(() => Math.random() - 0.5);
			return shuffled.slice(0, count);
		}

		const curriculumContext = await this.retrieveCurriculumContext(
			subject,
			topic,
		);

		const enrichParams = curriculumContext
			? { ...params, curriculumContext }
			: params;

		let questions: Question[];

		if (!questionType || questionType === "any") {
			questions = await this.generateMixed(enrichParams);
		} else {
			const types = Array.isArray(questionType) ? questionType : [questionType];
			const perTypeCount = Math.ceil(count / types.length);
			questions = [];

			for (const type of types) {
				try {
					const processor = this.registry.getProcessor(type);
					const typeParams = {
						...enrichParams,
						count: perTypeCount,
						questionType: type,
					};
					const result = await processor.generate(typeParams);
					questions.push(...result);
				} catch (error) {
					console.error(`[QuestionEngine] Failed to generate ${type}:`, error);
				}
			}
		}

		const sliced = questions.slice(0, count);

		return sliced;
	}

	async generateHint(params: HintParams): Promise<string> {
		const processor = this.registry.getProcessor(
			params.question.type as QuestionType,
		);
		return processor.generateHint(params.question as never);
	}

	async grade(question: Question, answer: UserAnswer): Promise<GradingResult> {
		const processor = this.registry.getProcessor(question.type as QuestionType);
		return processor.grade(question as never, answer);
	}

	validate(question: Question): ValidationResult {
		const processor = this.registry.getProcessor(question.type as QuestionType);
		const result = processor.validate(question as never);
		console.log(
			`[Quality] ${question.type}/${question.subject}: score=${result.score}, valid=${result.isValid}`,
		);
		return result;
	}

	getPromptManager(): PromptManager {
		return this.prompts;
	}

	listTypes(): QuestionType[] {
		return this.registry.listTypes();
	}

	private buildCacheKey(params: GenerationParams): string {
		const parts = [
			params.subject,
			params.topic ?? "",
			params.difficulty ?? "",
			params.questionType
				? Array.isArray(params.questionType)
					? params.questionType.join(",")
					: params.questionType
				: "",
			params.bloomLevel ?? "",
		];
		return parts.filter(Boolean).join(":");
	}

	private async retrieveCurriculumContext(
		subject: string,
		topic?: string,
	): Promise<string | null> {
		if (!topic) return null;
		try {
			const { listDocuments } = await import("@/lib/db/client");
			const { Query } = await import("appwrite");
			const { COLLECTIONS } = await import("@/lib/db/client");
			const results = await listDocuments(COLLECTIONS.TOPICS, [
				Query.equal("name", topic),
				Query.limit(1),
			]);
			if (results.length > 0) {
				const doc = results[0] as Record<string, unknown>;
				return (doc.description as string) ?? null;
			}
			return null;
		} catch {
			return null;
		}
	}

	private async generateMixed(params: GenerationParams): Promise<Question[]> {
		const batches: QuestionType[][] = [
			["multiple-choice", "matching"],
			["short-answer", "long-answer", "essay"],
			["calculation", "diagram"],
			["source-based", "data-response"],
			["programming"],
			["mixed"],
		];

		const results: Question[] = [];
		const count = params.count;
		const itemCount = Math.max(1, Math.ceil(count / batches.length));

		for (const batch of batches) {
			if (results.length >= count) break;
			const available = batch.filter((t) => this.registry.hasProcessor(t));
			if (available.length === 0) continue;

			const primaryType = available[0];
			try {
				const processor = this.registry.getProcessor(primaryType);
				const typeParams = {
					...params,
					count: itemCount,
					questionType: primaryType,
				};
				const questions = await processor.generate(typeParams);
				results.push(...questions);
			} catch (error) {
				console.error(
					`[QuestionEngine] Batch generation failed for ${primaryType}:`,
					error,
				);
			}
		}

		return results.slice(0, params.count);
	}
}
