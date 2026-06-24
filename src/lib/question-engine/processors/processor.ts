import { Effect } from "effect";
import { getAI } from "@/lib/ai";
import type { AIClient } from "@/lib/ai/client";
import { ensureArray, parseAIResponse } from "@/lib/ai/parse-response";
import type { PromptManager, RagContext } from "../prompt-manager";
import { attachWebSources } from "../source-mapper";
import type {
  GenerationParams,
  GradingResult,
  Question,
  QuestionProcessor,
  QuestionType,
  UserAnswer,
  ValidationResult,
} from "../types";
import { validateQuestion } from "../validators";
import type { GradeFn, HintFn } from "./types";

export class TypedQuestionProcessor<T extends QuestionType> implements QuestionProcessor<T> {
  private _ai?: AIClient;

  private get ai(): AIClient {
    if (!this._ai) {
      this._ai = getAI();
    }
    return this._ai;
  }

  constructor(
    public readonly type: T,
    private config: { generateTemperature: number },
    private gradeFn: GradeFn,
    private hintFn: HintFn,
    private prompts: PromptManager,
    ai?: AIClient,
  ) {
    this._ai = ai;
  }

  async generate(params: GenerationParams, ragContext?: RagContext): Promise<Question<T>[]> {
    const prompt = this.prompts.getPrompt(this.type, params, ragContext);
    const result = await this.ai.generateWithSystem(prompt.system, prompt.user, {
      maxTokens: 4096,
      temperature: this.config.generateTemperature,
    });
    const parsed = parseAIResponse<Question<T>[]>(result, []);
    if (!parsed) {
      throw new Error(`AI generation failed for ${this.type}`);
    }
    const questions = ensureArray(parsed.data) as (Question<T> & { sourceRefs?: unknown })[];
    for (const q of questions) {
      attachWebSources(q, ragContext);
    }
    return questions;
  }

  async generateHint(question: Question<T>, ragXml?: string): Promise<string> {
    return this.hintFn(question, this.prompts, this.ai, ragXml);
  }

  async grade(question: Question<T>, answer: UserAnswer): Promise<GradingResult> {
    return this.gradeFn(question, answer, this.prompts, this.ai);
  }

  gradeEffect(question: Question<T>, answer: UserAnswer): Effect.Effect<GradingResult> {
    return Effect.tryPromise(async () =>
      this.gradeFn(question, answer, this.prompts, this.ai),
    ).pipe(
      Effect.catchAll(() =>
        Effect.succeed({
          correct: false,
          feedback: "Grading failed.",
          maxScore: question.points,
          score: 0,
        } as GradingResult),
      ),
    );
  }

  generateEffect(params: GenerationParams, ragContext?: RagContext): Effect.Effect<Question<T>[]> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const prompt = self.prompts.getPrompt(self.type, params, ragContext);
      const result = yield* Effect.tryPromise(() =>
        self.ai.generateWithSystem(prompt.system, prompt.user, {
          maxTokens: 4096,
          temperature: self.config.generateTemperature,
        }),
      ).pipe(Effect.catchAll(() => Effect.succeed(null as never)));
      if (!result) {
        return [];
      }
      const parsed = parseAIResponse<Question<T>[]>(result, []);
      if (!parsed) {
        return [];
      }
      const questions = ensureArray(parsed.data) as (Question<T> & { sourceRefs?: unknown })[];
      for (const q of questions) {
        attachWebSources(q, ragContext);
      }
      return questions;
    });
  }

  generateHintEffect(question: Question<T>, ragXml?: string): Effect.Effect<string> {
    return Effect.tryPromise(async () => this.hintFn(question, this.prompts, this.ai, ragXml)).pipe(
      Effect.catchAll(() => Effect.succeed("")),
    );
  }

  validate(question: Question<T>): ValidationResult {
    return validateQuestion(question);
  }
}
