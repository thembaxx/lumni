import { Effect } from "effect";
import type { AIClient } from "@/lib/ai";
import { initAI, isAIConfigured } from "@/lib/ai";
import type { CacheResolver } from "@/lib/caching-strategy";
import { createCachingStrategy } from "@/lib/caching-strategy";
import { createEnrichmentPipeline, type EnrichmentPipeline } from "./enrichment-pipeline";
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

/**
 * Generates and validates questions for a given subject and topic using AI models with caching support.
 * The engine provides a unified interface for question generation across different subjects,
 * supports RAG (Retrieval-Augmented Generation) for web-grounded content, and implements
 * intelligent caching with fallbacks to Appwrite and AI generation when needed.
 */
export class QuestionEngine {
  private registry: ProcessorRegistry;
  private prompts: PromptManager;
  private ragDeps?: RagDeps;
  private cachingStrategy: CacheResolver<Question[], GenerationParams>;
  private lastRagContext: RagContext | null = null;
  private enrichmentPipeline: EnrichmentPipeline;

  /**
   * Creates a new QuestionEngine instance with optional RAG dependencies, caching strategy,
   * AI client, and enrichment pipeline.
   *
   * @param ragDeps - Optional RAG dependencies for web-grounded content generation.
   *                  Contains search functions and prompt building utilities.
   * @param caching - Optional caching strategy. If not provided, defaults to a multi-tier
   *                 strategy with Dexie (fast, local) and Appwrite (cloud) backends.
   * @param ai - Optional AI client for question generation. If not provided, will use
   *            the default AI provider chain (Gemini → Nvidia → Groq).
   * @param enrichment - Optional enrichment pipeline for curriculum/adaptation logic.
   *                     If not provided, uses the default enrichment pipeline.
   */
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
              const { questionCacheRepo: qRepo } =
                await import("@/lib/db/repositories/question-cache");
              const cached = await qRepo.get(p.subject, p.topic);
              if (cached && cached.length >= p.count) {
                const shuffled = this.shuffleArray(cached as Question[]);
                return shuffled.slice(0, p.count);
              }
              return null;
            },
            write: async (params, questions) => {
              const { questionCacheRepo: qRepo } =
                await import("@/lib/db/repositories/question-cache");
              await qRepo.cache(params.subject, questions as Question[], params.topic);
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
                const shuffled = this.shuffleArray(appwriteQuestions);
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

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Initializes the QuestionEngine with AI configuration and creates a new instance.
   * This static factory method handles AI client initialization and is typically called
   * once at application startup to ensure AI providers are ready for question generation.
   *
   * @param ragDeps - Optional RAG dependencies for web-grounded content generation.
   * @param ai - Optional AI client. If not provided, will initialize the default
   *            provider chain with keys from environment variables.
   * @returns A Promise that resolves to a new QuestionEngine instance.
   */
  static async initialize(ragDeps?: RagDeps, ai?: AIClient): Promise<QuestionEngine> {
    if (!isAIConfigured()) {
      initAI({
        geminiApiKey: process.env.GEMINI_API_KEY,
        groqApiKey: process.env.GROQ_API_KEY,
      });
    }
    return new QuestionEngine(ragDeps, undefined, ai);
  }

  /**
   * Generates a set of questions based on the provided parameters.
   * This method leverages intelligent caching to avoid unnecessary AI calls for
   * previously generated questions, and supports RAG for web-grounded content.
   * The generation process respects token budgets and respects cached data from
   * multiple sources (Dexie, Appwrite, or AI generation).
   *
   * @param params - Generation parameters including subject, topic, count,
   *                difficulty, and optional AI parameters like suggestedDifficulty.
   * @returns A Promise that resolves to an object containing the generated questions
   *          and optional RAG context for web source attribution.
   */
  generateEffect(params: GenerationParams): Effect.Effect<GenerateResult> {
    // oxlint-disable-next-line typescript(no-this-alias)
    const self = this;
    return Effect.gen(function* () {
      self.lastRagContext = null;
      const generated = yield* Effect.tryPromise(() => self.cachingStrategy.resolve(params)).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      );
      return { questions: generated ?? [], ragContext: self.lastRagContext } as GenerateResult;
    });
  }

  async generate(params: GenerationParams): Promise<GenerateResult> {
    return Effect.runPromise(this.generateEffect(params));
  }

  private async generateInternal(params: GenerationParams): Promise<Question[] | null> {
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
      const result = await this.generateBatch(enriched, ragContext, remainingCount);
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
      throw new Error(`Type mismatch: expected ${type} but got ${question.type}`);
    }
    const processor = this.registry.getProcessor(type);
    return { processor, typed: question as Question<T> };
  }

  /**
   * Generates a hint for a specific question using the appropriate processor.
   * This method uses the question's processor to generate a contextual hint
   * based on the question type and optionally web sources (RAG) if provided.
   *
   * @param params - Hint generation parameters including the question and
   *                optional RAG XML for web-grounded content.
   * @returns A Promise that resolves to a string containing the generated hint.
   */
  generateHintEffect(params: HintParams): Effect.Effect<string> {
    // oxlint-disable-next-line typescript(no-this-alias)
    const self = this;
    return Effect.gen(function* () {
      const { question } = params;
      const { processor, typed } = self.withProcessor(question, question.type as QuestionType);
      const hint = yield* Effect.tryPromise(() => processor.generateHint(typed, params.ragXml)).pipe(
        Effect.catchAll(() => Effect.succeed("")),
      );
      return hint;
    });
  }

  async generateHint(params: HintParams): Promise<string> {
    return Effect.runPromise(this.generateHintEffect(params));
  }

  /**
   * Grades a user's answer for a specific question using the appropriate processor.
   * This method applies the question's validation logic to evaluate the answer
   * and returns a grading result with score and feedback.
   *
   * @param question - The question to grade.
   * @param answer - The user's answer to be graded.
   * @returns A Promise that resolves to a GradingResult containing the score,
   *         feedback, and grading details.
   */
  gradeEffect(question: Question, answer: UserAnswer): Effect.Effect<GradingResult> {
    // oxlint-disable-next-line typescript(no-this-alias)
    const self = this;
    return Effect.gen(function* () {
      const { processor, typed } = self.withProcessor(question, question.type as QuestionType);
      const result = yield* Effect.tryPromise(() => processor.grade(typed, answer)).pipe(
        Effect.catchAll(() =>
          Effect.succeed({ score: 0, maxScore: 0, correct: false, feedback: "" } as GradingResult),
        ),
      );
      return result;
    });
  }

  async grade(question: Question, answer: UserAnswer): Promise<GradingResult> {
    return Effect.runPromise(this.gradeEffect(question, answer));
  }

  /**
   * Validates a question for completeness and correctness using the appropriate processor.
   * This method checks that the question meets all validation criteria for its type,
   * including required fields and format requirements.
   *
   * @param question - The question to validate.
   * @returns A ValidationResult containing the validation status, any errors found,
   *         and details about the validation checks performed.
   */
  validate(question: Question): ValidationResult {
    const { processor, typed } = this.withProcessor(question, question.type as QuestionType);
    return processor.validate(typed);
  }

  /**
   * Lists all available question types that this engine can generate.
   * This method returns the complete set of question types supported by the
   * processor registry, which may vary based on the configured AI client
   * and installed processors.
   *
   * @returns An array of QuestionType strings representing all available types.
   */
  listTypes(): QuestionType[] {
    return this.registry.listTypes();
  }

  private async enrichParams(params: GenerationParams): Promise<GenerationParams> {
    return this.enrichmentPipeline.enrich(params);
  }

  private async generateMixed(
    params: GenerationParams,
    ragContext: RagContext,
  ): Promise<Question[]> {
    const batches: QuestionType[][] = [
      ["multiple-choice", "matching", "match-pairs"],
      ["short-answer", "long-answer", "essay"],
      ["calculation", "diagram", "ordering"],
      ["fill-in-sequence", "diagram-labelling", "hot-spot"],
      ["source-based", "data-response"],
      ["programming"],
      ["mixed"],
    ];

    const count = params.count;
    const itemCount = Math.max(1, Math.ceil(count / batches.length));

    const batchResults = await Promise.all(
      batches.map(async (batch) => {
        const available = batch.filter((t) => this.registry.hasProcessor(t));
        if (available.length === 0) return [];

        const perType = Math.floor(itemCount / available.length);
        const remainder = itemCount - perType * available.length;
        const batchQuestions: Question[] = [];

        for (let i = 0; i < available.length && batchQuestions.length < itemCount; i++) {
          let needed = perType + (i < remainder ? 1 : 0);
          if (needed <= 0) continue;

          let generated = false;
          for (let j = 0; j < available.length && !generated; j++) {
            const tryType = available[(i + j) % available.length];
            const processor = this.registry.getProcessor(tryType);
            try {
              const questions = await processor.generate(
                { ...params, count: needed, questionType: tryType },
                ragContext,
              );
              if (questions.length > 0) {
                batchQuestions.push(...questions);
                generated = true;
              }
            } catch (e) {
              console.error(`[QuestionEngine] Generation failed for ${tryType}:`, e);
            }
          }
        }

        return batchQuestions;
      }),
    );

    return batchResults.flat().slice(0, count);
  }

  getPromptManager(): PromptManager {
    return this.prompts;
  }
}
