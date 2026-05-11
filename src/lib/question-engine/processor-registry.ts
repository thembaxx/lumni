import { CalculationProcessor } from "./processors/calculation-processor";
import { DataResponseProcessor } from "./processors/data-response-processor";
import { DiagramProcessor } from "./processors/diagram-processor";
import { EssayProcessor } from "./processors/essay-processor";
import { LongAnswerProcessor } from "./processors/long-answer-processor";
import { MatchingProcessor } from "./processors/matching-processor";
import { MCQProcessor } from "./processors/mcq-processor";
import { MixedProcessor } from "./processors/mixed-processor";
import { ProgrammingProcessor } from "./processors/programming-processor";
import { ShortAnswerProcessor } from "./processors/short-answer-processor";
import { SourceBasedProcessor } from "./processors/source-based-processor";
import type { QuestionProcessor, QuestionType } from "./types";

export class ProcessorRegistry {
	private processors = new Map<QuestionType, QuestionProcessor>();

	constructor() {
		this.register(new MCQProcessor());
		this.register(new MatchingProcessor());
		this.register(new ShortAnswerProcessor());
		this.register(new LongAnswerProcessor());
		this.register(new EssayProcessor());
		this.register(new CalculationProcessor());
		this.register(new DiagramProcessor());
		this.register(new ProgrammingProcessor());
		this.register(new SourceBasedProcessor());
		this.register(new DataResponseProcessor());
		this.register(new MixedProcessor());
	}

	private register(processor: QuestionProcessor): void {
		this.processors.set(processor.type, processor);
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
