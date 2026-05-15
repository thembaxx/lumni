import type { PromptManager } from "../prompt-manager";
import type { GradingResult, Question, UserAnswer } from "../types";

export type GradeFn = (
	q: Question,
	a: UserAnswer,
	prompts: PromptManager,
) => GradingResult | Promise<GradingResult>;

export type HintFn = (
	q: Question,
	prompts: PromptManager,
) => string | Promise<string>;

export interface ProcessorConfig {
	type: string;
	temperature: number;
	hint: HintFn;
	grade: GradeFn;
}
