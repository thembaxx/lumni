import { TypedQuestionProcessor } from "./processors/processor";
import { processorConfigs } from "./processors/processor-configs";
import { PromptManager } from "./prompt-manager";
import type { QuestionProcessor, QuestionType } from "./types";

export class ProcessorRegistry {
	private processors = new Map<QuestionType, QuestionProcessor>();

	constructor() {
		const prompts = new PromptManager();
		for (const config of processorConfigs) {
			const processor = new TypedQuestionProcessor(
				config.type as QuestionType,
				{ generateTemperature: config.temperature },
				config.grade,
				config.hint,
				prompts,
			);
			this.register(config.type as QuestionType, processor);
		}
	}

	private register(type: QuestionType, processor: QuestionProcessor): void {
		this.processors.set(type, processor);
	}

	getProcessor<T extends QuestionType>(type: T): QuestionProcessor<T> {
		const processor = this.processors.get(type);
		if (!processor) {
			throw new Error(`No processor registered for question type: ${type}`);
		}
		return processor as QuestionProcessor<T>;
	}

	getProcessors(types: QuestionType[]): QuestionProcessor[] {
		return types.map((t) => this.getProcessor(t));
	}

	hasProcessor(type: QuestionType): boolean {
		return this.processors.has(type);
	}

	listTypes(): QuestionType[] {
		return Array.from(this.processors.keys());
	}
}
