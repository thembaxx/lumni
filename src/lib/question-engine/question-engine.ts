import { Effect } from "effect";
import type { AIClient } from "@/lib/ai";
import { initAI, isAIConfigured } from "@/lib/ai";
import type { CacheResolver } from "@/lib/caching-strategy";
import { createEnrichmentPipeline } from "./enrichment-pipeline";
import type { EnrichmentPipeline } from "./enrichment-pipeline";
import { ProcessorRegistry } from "./processor-registry";
import { PromptManager } from "./prompt-manager";
import { fetchRagContext } from "./rag-enricher";
import type { RagDeps } from "./rag-enricher";
import type {
  GenerateResult,
  GenerationParams,
  GradingResult,
  HintParams,
  Question,
  QuestionProcessor,
  QuestionType,
  UserAnswer,
  ValidationResult,
} from "./types";
import { mapPoolToQuestion } from "./pool-mapper";
import { createQuestionCacheStrategy } from "./cache-config";
import { generateBatch } from "./batch-generator";

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
  private cachingStrategy: CacheResolver<GenerateResult, GenerationParams>;
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
    caching?: CacheResolver<GenerateResult, GenerationParams>,
    ai?: AIClient,
    enrichment?: EnrichmentPipeline,
  ) {
    this.ragDeps = ragDeps;
    this.prompts = new PromptManager(ragDeps);
    this.registry = new ProcessorRegistry(this.prompts, ai);
    this.enrichmentPipeline = enrichment ?? createEnrichmentPipeline();
    this.cachingStrategy =
      caching ?? createQuestionCacheStrategy((params) => this.generateInternal(params));
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
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const result = yield* Effect.tryPromise(() => self.cachingStrategy.resolve(params)).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      );
      return result ?? { questions: [], ragContext: null };
    });
  }

  async generate(params: GenerationParams): Promise<GenerateResult> {
    return Effect.runPromise(this.generateEffect(params));
  }

  private async generateInternal(params: GenerationParams): Promise<GenerateResult | null> {
    const enriched = await this.enrichParams(params);

    const poolQuestions = enriched.poolQuestions ?? [];
    const poolCount = poolQuestions.length;
    const remainingCount = Math.max(0, enriched.count - poolCount);

    if (remainingCount === 0 && poolCount > 0) {
      return {
        questions: poolQuestions.map((pq) =>
          mapPoolToQuestion(pq, enriched.subject, enriched.topic),
        ),
        ragContext: null,
      };
    }

    if (enriched.pastPaperMode) {
      return poolCount > 0
        ? {
            questions: poolQuestions.map((pq) =>
              mapPoolToQuestion(pq, enriched.subject, enriched.topic),
            ),
            ragContext: null,
          }
        : null;
    }

    const ragContext = await fetchRagContext(
      enriched.subject,
      enriched.topic,
      enriched.userId,
      this.ragDeps,
    );

    const MAX_RETRIES = 2;

    let questions: Question[] = [];
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const result = await generateBatch(this.registry, enriched, ragContext, remainingCount);
      if (result.length > questions.length) {
        questions = result;
        if (questions.length >= remainingCount) {
          break;
        }
      }
    }

    questions = questions.slice(0, remainingCount);

    if (poolCount > 0) {
      const directQuestions = poolQuestions.map((pq) =>
        mapPoolToQuestion(pq, enriched.subject, enriched.topic),
      );
      questions = [...directQuestions, ...questions];
    }

    return questions.length > 0 ? { questions, ragContext } : null;
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
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { question } = params;
      const { processor, typed } = self.withProcessor(question, question.type as QuestionType);
      return yield* processor.generateHintEffect(typed, params.ragXml);
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
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const { processor, typed } = self.withProcessor(question, question.type as QuestionType);
      return yield* processor.gradeEffect(typed, answer);
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

  getPromptManager(): PromptManager {
    return this.prompts;
  }
}
