import { initAI, isAIConfigured } from "@/lib/ai";
import type { CacheTier } from "@/lib/caching-strategy";
import { CachingStrategy } from "@/lib/caching-strategy";
import { getCachedQuestions } from "@/lib/db/offline";
import { ProcessorRegistry } from "./processor-registry";
import { PromptManager } from "./prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	HintParams,
	Question,
	QuestionProcessor,
	QuestionType,
	UserAnswer,
	ValidationResult,
} from "./types";

export class QuestionEngine {
	private registry: ProcessorRegistry;
	private prompts: PromptManager;
	private cachingStrategy: CachingStrategy<Question[], GenerationParams>;

	constructor() {
		this.prompts = new PromptManager();
		this.registry = new ProcessorRegistry(this.prompts);
		this.cachingStrategy = new CachingStrategy<Question[], GenerationParams>(
			[
				{
					name: "dexie",
					read: async (p) => {
						const cached = await getCachedQuestions(p.subject, p.topic);
						if (cached && cached.length >= p.count) {
							const shuffled = [...(cached as Question[])].sort(
								() => Math.random() - 0.5,
							);
							return shuffled.slice(0, p.count);
						}
						return null;
					},
					write: async (params, questions) => {
						const { cacheQuestions } = await import("@/lib/db/offline");
						await cacheQuestions(params.subject, questions as Question[], params.topic);
					},
				},
				{
					name: "appwrite",
					read: async (p) => {
						const { loadQuestionsFromAppwrite } = await import("./persistence");
						const appwriteQuestions = await loadQuestionsFromAppwrite(
							p.subject,
							p.topic,
							p.count,
						);
						if (appwriteQuestions.length >= p.count) {
							const shuffled = appwriteQuestions.sort(
								() => Math.random() - 0.5,
							);
							return shuffled.slice(0, p.count);
						}
						return null;
					},
					write: async () => {},
				},
			],
			{
				generate: async (params) => {
					const enriched = await this.enrichParams(params);
					const { questionType, count } = enriched;
					let questions: Question[];

					if (!questionType || questionType === "any") {
						questions = await this.generateMixed(enriched);
					} else {
						const types = Array.isArray(questionType)
							? questionType
							: [questionType];
						const perTypeCount = Math.ceil(count / types.length);
						questions = [];

						for (const type of types) {
							try {
								const processor = this.registry.getProcessor(type);
								const typeParams = {
									...enriched,
									count: perTypeCount,
									questionType: type,
								};
								const result = await processor.generate(typeParams);
								questions.push(...result);
							} catch (error) {
								console.error(
									`[QuestionEngine] Failed to generate ${type}:`,
									error,
								);
							}
						}
					}

					return questions.slice(0, count);
				},
			},
		);
	}

	static async initialize(): Promise<QuestionEngine> {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
		}
		return new QuestionEngine();
	}

	async generate(params: GenerationParams): Promise<Question[]> {
		const generated = await this.cachingStrategy.resolve(params);
		return generated ?? [];
	}

	private withProcessor<T extends QuestionType>(
		question: Question,
		type: T,
	): { processor: QuestionProcessor<T>; typed: Question<T> } {
		if (question.type !== type) {
			throw new Error(
				`Type mismatch: expected ${type} but got ${question.type}`,
			);
		}
		const processor = this.registry.getProcessor(type);
		return { processor, typed: question as Question<T> };
	}

	async generateHint(params: HintParams): Promise<string> {
		const { question } = params;
		const { processor, typed } = this.withProcessor(
			question,
			question.type as QuestionType,
		);
		return processor.generateHint(typed);
	}

	async grade(question: Question, answer: UserAnswer): Promise<GradingResult> {
		const { processor, typed } = this.withProcessor(
			question,
			question.type as QuestionType,
		);
		return processor.grade(typed, answer);
	}

	validate(question: Question): ValidationResult {
		const { processor, typed } = this.withProcessor(
			question,
			question.type as QuestionType,
		);
		return processor.validate(typed);
	}

	listTypes(): QuestionType[] {
		return this.registry.listTypes();
	}

	private async enrichParams(
		params: GenerationParams,
	): Promise<GenerationParams> {
		const curriculumContext = await this.retrieveCurriculumContext(
			params.subject,
			params.topic,
		);
		if (!curriculumContext) return params;
		return { ...params, curriculumContext };
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

	getPromptManager(): PromptManager {
		return this.prompts;
	}
}
