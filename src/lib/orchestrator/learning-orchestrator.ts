import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type {
	GenerationParams,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { serializeQuestionType } from "@/lib/shared/question-type";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";
import { enqueue } from "./job-queue";
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

	async generateQuestionSet(params: GenerationParams): Promise<GenerateResult> {
		const startTime = Date.now();
		const { questionType, subject, topic, count } = params;

		const questions = await this.engine.generate(params);
		const sliced = questions.slice(0, count);

		const jobIds: number[] = [];

		const syncJobId = await enqueue("appwrite-sync", {
			questions: sliced,
			subject,
			topic,
		});
		jobIds.push(syncJobId);

		trackEngineEvent({
			event: "generate",
			subject,
			questionType: serializeQuestionType(questionType),
			count: sliced.length,
			success: true,
			duration: Date.now() - startTime,
		});

		return {
			questions: sliced,
			count: sliced.length,
			type: serializeQuestionType(questionType),
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

		const repJobId = await enqueue("spaced-rep-update", {
			question,
			result: { correct: result.correct, score: result.score },
		});
		jobIds.push(repJobId);

		const analyticsJobId = await enqueue("analytics-sync", {
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

		const progressJobId = await enqueue("progress-update", {
			subject: question.subject,
			result: { correct: result.correct, score: result.score },
		});
		jobIds.push(progressJobId);

		const competencyJobId = await enqueue("competency-update", {
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
}
