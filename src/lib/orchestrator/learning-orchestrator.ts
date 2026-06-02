import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type {
	GenerationParams,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { serializeQuestionType } from "@/lib/shared/question-type";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";
import { enqueueGradeSideEffects } from "./grading";
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

		const [syncJobId, ...visualJobIds] = await Promise.all([
			enqueue("appwrite-sync", {
				questions: sliced,
				subject,
				topic,
			}),
			...sliced.map((q) =>
				enqueue("visual-generation", {
					questionId: q.id,
					questionText: q.questionText,
					subject,
					topic,
				}),
			),
		]);

		const jobIds = [syncJobId, ...visualJobIds];

		trackEngineEvent({
			event: "generate",
			subject,
			questionType: serializeQuestionType(questionType),
			count: sliced.length,
			success: true,
			duration: Date.now() - startTime,
		});

		const ragContext = this.engine.getLastRagContext();
		const sources =
			ragContext?.sources.map((s) => ({ url: s.url, title: s.title })) ?? [];

		return {
			questions: sliced,
			count: sliced.length,
			type: serializeQuestionType(questionType),
			jobIds,
			sources,
		};
	}

	async gradeAndTrack(
		question: Question,
		answer: UserAnswer,
	): Promise<GradeResult> {
		const startTime = Date.now();

		const result = await this.engine.grade(question, answer);

		await enqueueGradeSideEffects({
			subject: question.subject,
			topic: question.topic,
			bloomLevel: question.bloomTaxonomy,
			questionType: question.type,
			score: result.score,
			maxScore: result.maxScore,
			correct: result.correct,
			question,
		});

		trackEngineEvent({
			event: "grade",
			subject: question.subject,
			questionType: question.type,
			success: true,
			duration: Date.now() - startTime,
		});

		return { result, jobIds: [] };
	}
}
