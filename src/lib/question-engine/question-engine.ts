import { initAI, isAIConfigured } from "@/lib/ai";
import { createCachingStrategy } from "@/lib/caching-strategy";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { ProcessorRegistry } from "./processor-registry";
import { PromptManager, type RagContext } from "./prompt-manager";
import { fetchRagContext, type RagDeps } from "./rag-enricher";
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
	private ragDeps?: RagDeps;
	private cachingStrategy: ReturnType<
		typeof createCachingStrategy<Question[], GenerationParams>
	>;
	private lastRagContext: RagContext | null = null;

	constructor(ragDeps?: RagDeps) {
		this.ragDeps = ragDeps;
		this.prompts = new PromptManager(ragDeps);
		this.registry = new ProcessorRegistry(this.prompts);
		this.cachingStrategy = createCachingStrategy<Question[], GenerationParams>(
			[
				{
					name: "dexie",
					read: async (p) => {
						const { getCachedQuestions } = await import(
							"@/lib/db/repositories/question-cache"
						);
						const cached = await getCachedQuestions(p.subject, p.topic);
						if (cached && cached.length >= p.count) {
							const shuffled = (cached as Question[]).toSorted(
								() => Math.random() - 0.5,
							);
							return shuffled.slice(0, p.count);
						}
						return null;
					},
					write: async (params, questions) => {
						const { cacheQuestions } = await import(
							"@/lib/db/repositories/question-cache"
						);
						await cacheQuestions(
							params.subject,
							questions as Question[],
							params.topic,
						);
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
			(params) => this.generateInternal(params),
		);
	}

	static async initialize(ragDeps?: RagDeps): Promise<QuestionEngine> {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
		}
		return new QuestionEngine(ragDeps);
	}

	async generate(params: GenerationParams): Promise<Question[]> {
		const generated = await this.cachingStrategy.resolve(params);
		return generated ?? [];
	}

	private async generateInternal(
		params: GenerationParams,
	): Promise<Question[] | null> {
		const enriched = await this.enrichParams(params);
		const ragContext = await fetchRagContext(
			enriched.subject,
			enriched.topic,
			enriched.userId,
			this.ragDeps,
		);
		this.lastRagContext = ragContext;

		const { questionType, count } = enriched;
		let questions: Question[];

		if (!questionType || questionType === "any") {
			questions = await this.generateMixed(enriched, ragContext);
		} else {
			const types = Array.isArray(questionType) ? questionType : [questionType];
			const perTypeCount = Math.ceil(count / types.length);
			questions = [];

			const typeResults = await Promise.all(
				types.map(async (type) => {
					try {
						const processor = this.registry.getProcessor(type);
						const typeParams = {
							...enriched,
							count: perTypeCount,
							questionType: type,
						};
						const result = await processor.generate(typeParams, ragContext);
						return result;
					} catch (error) {
						console.error(
							`[QuestionEngine] Failed to generate ${type}:`,
							error,
						);
						return [];
					}
				}),
			);
			for (const result of typeResults) {
				questions.push(...result);
			}
		}

		return questions.slice(0, count);
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
		const exampleCount = params.pastPaperMode ? 5 : 3;
		const pastPaperExamples = await this.retrievePastPaperExamples(
			params.subject,
			params.topic,
			exampleCount,
		);
		return {
			...params,
			...(curriculumContext ? { curriculumContext } : {}),
			...(pastPaperExamples.length > 0 ? { pastPaperExamples } : {}),
		};
	}

	private async retrievePastPaperExamples(
		subject: string,
		topic?: string,
		limit: number = 3,
	): Promise<
		{ questionText: string; answerText: string; marks: number; year: number }[]
	> {
		if (!subject) return [];
		try {
			const url = new URL(
				`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/exam-papers/questions`,
			);
			url.searchParams.set("subject", subject);
			if (topic) url.searchParams.set("topic", topic);
			url.searchParams.set("limit", String(limit));

			const res = await fetch(url.toString(), { cache: "no-store" });
			if (!res.ok) return [];
			const data = await res.json();
			return (data.questions as PastPaperQuestion[])
				.slice(0, limit)
				.map((q) => ({
					questionText: q.questionText,
					answerText: q.answerText,
					marks: q.marks,
					year: q.year,
				}));
		} catch {
			return [];
		}
	}

	private async retrieveCurriculumContext(
		_subject: string,
		topic?: string,
	): Promise<string | null> {
		if (!topic) return null;
		try {
			const [{ listDocuments }, { Query }, { COLLECTIONS }] = await Promise.all(
				[
					import("@/lib/db/client"),
					import("appwrite"),
					import("@/lib/db/client"),
				],
			);
			const results = await listDocuments(COLLECTIONS.TOPICS, [
				Query.equal("name", topic),
				Query.limit(1),
			]);
			if (results.length > 0) {
				const doc = results[0] as Record<string, unknown>;
				return (doc.description as string) ?? null;
			}
			return null;
		} catch (e) {
			console.warn("Retrieve curriculum context failed:", e);
			return null;
		}
	}

	private async generateMixed(
		params: GenerationParams,
		ragContext: RagContext,
	): Promise<Question[]> {
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

			const perType = Math.floor(itemCount / available.length);
			const remainder = itemCount - perType * available.length;

			for (let i = 0; i < available.length && results.length < count; i++) {
				let needed = perType + (i < remainder ? 1 : 0);
				needed = Math.min(needed, count - results.length);
				if (needed <= 0) continue;

				const candidates = await Promise.allSettled(
					available.map((_, j) => {
						const tryType = available[(i + j) % available.length];
						const processor = this.registry.getProcessor(tryType);
						return processor.generate(
							{
								...params,
								count: needed,
								questionType: tryType,
							},
							ragContext,
						);
					}),
				);
				for (const result of candidates) {
					if (result.status === "fulfilled") {
						results.push(...result.value);
						break;
					}
					console.error(`[QuestionEngine] Generation failed:`, result.reason);
				}
			}
		}

		return results.slice(0, params.count);
	}

	getPromptManager(): PromptManager {
		return this.prompts;
	}

	getLastRagContext(): RagContext | null {
		return this.lastRagContext;
	}
}
