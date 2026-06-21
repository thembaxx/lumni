import type { AIClient } from "@/lib/ai";
import { initAI, isAIConfigured } from "@/lib/ai";
import type { CacheResolver } from "@/lib/caching-strategy";
import { createCachingStrategy } from "@/lib/caching-strategy";
import {
	createEnrichmentPipeline,
	type EnrichmentPipeline,
} from "./enrichment-pipeline";
import { ProcessorRegistry } from "./processor-registry";
import { PromptManager, type RagContext } from "./prompt-manager";
import { fetchRagContext, type RagDeps } from "./rag-enricher";
import type {
	BloomLevel,
	GenerateResult,
	GenerationParams,
	GradingResult,
	HintParams,
	Question,
	QuestionBody,
	QuestionProcessor,
	QuestionType,
	UserAnswer,
	ValidationResult,
} from "./types";

export class QuestionEngine {
	private registry: ProcessorRegistry;
	private prompts: PromptManager;
	private ragDeps?: RagDeps;
	private cachingStrategy: CacheResolver<Question[], GenerationParams>;
	private lastRagContext: RagContext | null = null;
	private enrichmentPipeline: EnrichmentPipeline;

	constructor(
		ragDeps?: RagDeps,
		caching?: CacheResolver<Question[], GenerationParams>,
		ai?: AIClient,
		enrichment?: EnrichmentPipeline,
	) {
		this.ragDeps = ragDeps;
		this.prompts = new PromptManager(ragDeps);
		this.registry = new ProcessorRegistry(this.prompts, ai);
		this.enrichmentPipeline = enrichment ?? createEnrichmentPipeline();
		this.cachingStrategy =
			caching ??
			createCachingStrategy<Question[], GenerationParams>(
				[
					{
						name: "dexie",
						read: async (p) => {
							const { questionCacheRepo: qRepo } = await import(
								"@/lib/db/repositories/question-cache"
							);
							const cached = await qRepo.get(p.subject, p.topic);
							if (cached && cached.length >= p.count) {
								const shuffled = (cached as Question[]).toSorted(
									() => Math.random() - 0.5,
								);
								return shuffled.slice(0, p.count);
							}
							return null;
						},
						write: async (params, questions) => {
							const { questionCacheRepo: qRepo } = await import(
								"@/lib/db/repositories/question-cache"
							);
							await qRepo.cache(
								params.subject,
								questions as Question[],
								params.topic,
							);
						},
					},
					{
						name: "appwrite",
						read: async (p) => {
							const { loadQuestionsFromAppwrite } = await import(
								"./persistence"
							);
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

	static async initialize(
		ragDeps?: RagDeps,
		ai?: AIClient,
	): Promise<QuestionEngine> {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
		}
		return new QuestionEngine(ragDeps, undefined, ai);
	}

	async generate(params: GenerationParams): Promise<GenerateResult> {
		this.lastRagContext = null;
		const generated = await this.cachingStrategy.resolve(params);
		return { questions: generated ?? [], ragContext: this.lastRagContext };
	}

	private async generateInternal(
		params: GenerationParams,
	): Promise<Question[] | null> {
		const enriched = await this.enrichParams(params);

		// Serve pool questions directly (no AI generation needed)
		const poolQuestions = enriched.poolQuestions ?? [];
		const poolCount = poolQuestions.length;
		const remainingCount = Math.max(0, enriched.count - poolCount);

		const mapPoolToQuestion = (
			pq: NonNullable<GenerationParams["poolQuestions"]>[number],
		): Question => {
			const qType = (pq.type as QuestionType) ?? "short-answer";
			const bloom = (pq.bloomLevel as BloomLevel) ?? "understand";

			let body: QuestionBody[typeof qType];
			if (qType === "multiple-choice") {
				body = {
					options: [
						{ id: "a", text: pq.answerText, isCorrect: true },
						{ id: "b", text: "None of the above", isCorrect: false },
					],
					correctOptionId: "a",
					allowMultiple: false,
				} as QuestionBody["multiple-choice"];
			} else if (qType === "calculation") {
				body = {
					formula: "",
					correctValue: Number.NaN,
					unit: "",
					tolerance: 0,
				} as QuestionBody["calculation"];
			} else {
				body = {
					modelAnswer: pq.answerText,
					acceptableAnswers: [pq.answerText],
					maxLength: 500,
				} as QuestionBody["short-answer"];
			}

			return {
				id: pq.id,
				type: qType,
				subject: enriched.subject,
				topic: pq.topic ?? enriched.topic ?? "",
				difficulty: "Medium" as const,
				bloomTaxonomy: bloom,
				points: pq.marks,
				questionText: pq.questionText,
				hint: "",
				explanation: `From ${pq.year} Paper ${pq.paperNumber}`,
				body,
				metadata: {
					createdAt: Date.now(),
					source: "imported",
				},
				webSources: [
					{
						title: `${enriched.subject} ${pq.year} Paper ${pq.paperNumber}`,
						url: "#",
					},
				],
				sourcePaperId: pq.id,
				sourcePastPaperQuestionId: pq.id,
			};
		};

		if (remainingCount === 0 && poolCount > 0) {
			return poolQuestions.map(mapPoolToQuestion);
		}

		const ragContext = await fetchRagContext(
			enriched.subject,
			enriched.topic,
			enriched.userId,
			this.ragDeps,
		);
		this.lastRagContext = ragContext;

		const MAX_RETRIES = 2;

		let questions: Question[] = [];
		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			const result = await this.generateBatch(
				enriched,
				ragContext,
				remainingCount,
			);
			if (result.length > questions.length) {
				questions = result;
				if (questions.length >= remainingCount) break;
			}
		}

		questions = questions.slice(0, remainingCount);

		// Prepend pool questions
		if (poolCount > 0) {
			const directQuestions: Question[] = poolQuestions.map(mapPoolToQuestion);
			questions = [...directQuestions, ...questions];
		}

		return questions.length > 0 ? questions : null;
	}

	private async generateBatch(
		enriched: GenerationParams,
		ragContext: RagContext,
		count: number,
	): Promise<Question[]> {
		if (!enriched.questionType || enriched.questionType === "any") {
			return this.generateMixed(enriched, ragContext);
		}
		const types = Array.isArray(enriched.questionType)
			? enriched.questionType
			: [enriched.questionType];
		const perTypeCount = Math.ceil(count / types.length);
		const typeResults = await Promise.all(
			types.map(async (type) => {
				try {
					const processor = this.registry.getProcessor(type);
					const typeParams = {
						...enriched,
						count: perTypeCount,
						questionType: type,
					};
					return await processor.generate(typeParams, ragContext);
				} catch (error) {
					console.error(`[QuestionEngine] Failed to generate ${type}:`, error);
					return [];
				}
			}),
		);
		return typeResults.flat();
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
		return this.enrichmentPipeline.enrich(params);
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
}
