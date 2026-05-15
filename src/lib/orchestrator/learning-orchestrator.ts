import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type {
	GenerationParams,
	GradingResult,
	HintParams,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";
import { jobQueue } from "./job-queue";
import type { GenerateResult, GradeResult } from "./types";

export class LearningOrchestrator {
	private engine: QuestionEngine;

	constructor(engine: QuestionEngine) {
		this.engine = engine;
	}

	static async initialize(): Promise<LearningOrchestrator> {
		const engine = await QuestionEngine.initialize();
		return new LearningOrchestrator(engine);
	}

	async generate(params: GenerationParams): Promise<Question[]> {
		return this.engine.generate(params);
	}

	async generateQuestionSet(params: GenerationParams): Promise<GenerateResult> {
		const startTime = Date.now();
		const { questionType, subject, topic, count } = params;

		const questions = await this.engine.generate(params);
		const sliced = questions.slice(0, count);

		const jobIds: number[] = [];

		const syncJobId = await jobQueue.enqueue("appwrite-sync", {
			questions: sliced,
			subject,
			topic,
		});
		jobIds.push(syncJobId);

		trackEngineEvent({
			event: "generate",
			subject,
			questionType: questionType
				? Array.isArray(questionType)
					? questionType.join(",")
					: questionType
				: "any",
			count: sliced.length,
			success: true,
			duration: Date.now() - startTime,
		});

		return {
			questions: sliced,
			count: sliced.length,
			type: questionType
				? Array.isArray(questionType)
					? questionType.join(",")
					: questionType
				: "any",
			jobIds,
		};
	}

	async gradeAndTrack(
		question: Question,
		answer: UserAnswer,
	): Promise<GradeResult> {
		const startTime = Date.now();

		const result = await this.engine.grade(question, answer);
		const jobIds: number[] = [];

		const repJobId = await jobQueue.enqueue("spaced-rep-update", {
			question,
			result: { correct: result.correct, score: result.score },
		});
		jobIds.push(repJobId);

		const analyticsJobId = await jobQueue.enqueue("analytics-sync", {
			events: [
				{
					event: "grade",
					timestamp: startTime,
					subject: question.subject,
					questionType: question.type,
					success: result.correct,
					duration: Date.now() - startTime,
				},
			],
		});
		jobIds.push(analyticsJobId);

		const progressJobId = await jobQueue.enqueue("progress-update", {
			subject: question.subject,
			result: { correct: result.correct, score: result.score },
		});
		jobIds.push(progressJobId);

		const competencyJobId = await jobQueue.enqueue("competency-update", {
			subject: question.subject,
			topic: question.topic,
			bloomLevel: question.bloomTaxonomy,
			score: result.maxScore > 0 ? (result.score / result.maxScore) * 100 : 0,
		});
		jobIds.push(competencyJobId);

		trackEngineEvent({
			event: "grade",
			subject: question.subject,
			questionType: question.type,
			success: true,
			duration: Date.now() - startTime,
		});

		return { result, jobIds };
	}

	async grade(question: Question, answer: UserAnswer): Promise<GradingResult> {
		return this.engine.grade(question, answer);
	}

	async generateHint(params: HintParams): Promise<string> {
		const hint = await this.engine.generateHint(params);

		trackEngineEvent({
			event: "hint",
			subject: params.question.subject,
			questionType: params.question.type,
			success: true,
		});

		return hint;
	}

	validate(question: Question) {
		return this.engine.validate(question);
	}

	listTypes() {
		return this.engine.listTypes();
	}
}
