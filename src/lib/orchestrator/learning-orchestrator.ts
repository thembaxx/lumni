import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { embedText } from "@/lib/embedding/client";
import { findTopK } from "@/lib/embedding/similarity";
import { QuestionEngine } from "@/lib/question-engine/question-engine";
import type {
	GenerationParams,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { logError } from "@/lib/shared/logger";
import { serializeQuestionType } from "@/lib/shared/question-type";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";
import { enqueueGradeSideEffects } from "./grading";
import { enqueue } from "./job-queue";
import type { GenerateResult, GradeResult } from "./types";

export class LearningOrchestrator {
	private engine: QuestionEngine;
	private db: DataAccess;

	constructor(engine: QuestionEngine, db: DataAccess = dexieDataAccess) {
		this.engine = engine;
		this.db = db;
	}

	static async initialize(): Promise<LearningOrchestrator> {
		const engine = await QuestionEngine.initialize();
		return new LearningOrchestrator(engine);
	}

	async generateQuestionSet(params: GenerationParams): Promise<GenerateResult> {
		const startTime = Date.now();
		const { questionType, subject, topic, count } = params;

		const { questions: rawQuestions, ragContext } =
			await this.engine.generate(params);
		let questions = rawQuestions;

		// Dedup: check AI-generated questions against pool
		const poolQuestions = questions.filter(
			(q) => q.metadata?.source === "imported",
		);
		const aiQuestions = questions.filter(
			(q) => q.metadata?.source !== "imported",
		);
		const dedupResults = await Promise.allSettled(
			aiQuestions.map((q) => this.checkDuplicate(q, subject)),
		);
		const aiDeduped = aiQuestions.filter((_, i) => {
			const result = dedupResults[i];
			return result.status === "rejected" || !result.value;
		});
		questions = [...poolQuestions, ...aiDeduped].slice(0, count);

		const [syncJobId, ...visualJobIds] = await Promise.all([
			enqueue("appwrite-sync", {
				questions,
				subject,
				topic,
			}),
			...questions.map((q) =>
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
			count: questions.length,
			success: true,
			duration: Date.now() - startTime,
		});

		const sources =
			ragContext?.sources.map((s) => ({ url: s.url, title: s.title })) ?? [];

		return {
			questions,
			count: questions.length,
			type: serializeQuestionType(questionType),
			jobIds,
			sources,
		};
	}

	private async checkDuplicate(
		question: Question,
		subject: string,
	): Promise<boolean> {
		try {
			const embedding = await embedText(question.questionText);
			if (!embedding) return false;
			const top = await findTopK(
				{
					subject,
					queryEmbedding: new Float32Array(embedding),
					k: 1,
					threshold: 0.85,
				},
				{
					questionEmbeddings: this.db.questionEmbeddings,
					pastPaperQuestions: this.db.pastPaperQuestions,
				},
			);
			return top.length > 0;
		} catch (e) {
			logError("LearningOrchestrator.dedup", e);
			return false;
		}
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
