import { initAI, isAIConfigured } from "@/lib/ai";
import { cacheQuestions } from "@/lib/db/offline";
import { ProcessorRegistry } from "@/lib/question-engine/processor-registry";
import { PromptManager } from "@/lib/question-engine/prompt-manager";
import type {
	GenerationParams,
	GradingResult,
	HintParams,
	Question,
	QuestionType,
	UserAnswer,
	ValidationResult,
} from "@/lib/question-engine/types";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";
import { jobQueue } from "./job-queue";
import type { GenerateResult, GradeResult } from "./types";

export class LearningOrchestrator {
	private registry: ProcessorRegistry;
	private prompts: PromptManager;

	private constructor() {
		this.registry = new ProcessorRegistry();
		this.prompts = new PromptManager();
	}

	static async initialize(): Promise<LearningOrchestrator> {
		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
				deepseekApiKey: process.env.DEEPSEEK_API_KEY,
			});
		}
		return new LearningOrchestrator();
	}

	async generate(params: GenerationParams): Promise<Question[]> {
		const { questionType, count } = params;

		if (!questionType || questionType === "any") {
			return this.generateMixed(params);
		}

		const types = Array.isArray(questionType) ? questionType : [questionType];
		const perTypeCount = Math.ceil(count / types.length);
		const questions: Question[] = [];

		for (const type of types) {
			try {
				const processor = this.registry.getProcessor(type);
				const typeParams = {
					...params,
					count: perTypeCount,
					questionType: type,
				};
				const result = await processor.generate(typeParams);
				questions.push(...result);
			} catch (error) {
				console.error(`[Engine] Failed to generate ${type}:`, error);
			}
		}

		return questions.slice(0, count);
	}

	async generateQuestionSet(params: GenerationParams): Promise<GenerateResult> {
		const startTime = Date.now();
		const { questionType, subject, topic, count } = params;

		const enriched = await this.enrichParams(params);
		const questions = await this.generate(enriched);
		const sliced = questions.slice(0, count);

		await cacheQuestions(subject, sliced, topic);

		const jobIds: number[] = [];

		const syncJobId = await jobQueue.enqueue("appwrite-sync", {
			questions: sliced,
			subject,
			topic,
		});
		jobIds.push(syncJobId);

		const visualJobId = await jobQueue.enqueue("visual-pre-cache", sliced, {
			scheduledAt: Date.now() + 100,
		});
		jobIds.push(visualJobId);

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

		const result = await this.grade(question, answer);
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
		const processor = this.registry.getProcessor(question.type as QuestionType);
		return processor.grade(question as never, answer);
	}

	async generateHint(params: HintParams): Promise<string> {
		const processor = this.registry.getProcessor(
			params.question.type as QuestionType,
		);
		const hint = await processor.generateHint(params.question as never);

		trackEngineEvent({
			event: "hint",
			subject: params.question.subject,
			questionType: params.question.type,
			success: true,
		});

		return hint;
	}

	validate(question: Question): ValidationResult {
		const processor = this.registry.getProcessor(question.type as QuestionType);
		const result = processor.validate(question as never);
		return result;
	}

	listTypes(): QuestionType[] {
		return this.registry.listTypes();
	}

	private async enrichParams(
		params: GenerationParams,
	): Promise<GenerationParams> {
		const curriculumContext = await this.retrieveCurriculumContext(
			params.subject,
			params.topic,
		);
		if (!curriculumContext) return params;
		return { ...params, curriculumContext };
	}

	private async retrieveCurriculumContext(
		subject: string,
		topic?: string,
	): Promise<string | null> {
		if (!topic) return null;
		try {
			const { listDocuments } = await import("@/lib/db/client");
			const { Query } = await import("appwrite");
			const { COLLECTIONS } = await import("@/lib/db/client");
			const results = await listDocuments(COLLECTIONS.TOPICS, [
				Query.equal("name", topic),
				Query.limit(1),
			]);
			if (results.length > 0) {
				const doc = results[0] as Record<string, unknown>;
				return (doc.description as string) ?? null;
			}
			return null;
		} catch {
			return null;
		}
	}

	private async generateMixed(params: GenerationParams): Promise<Question[]> {
		const batches: QuestionType[][] = [
			["multiple-choice", "matching"],
			["short-answer", "long-answer", "essay"],
			["calculation", "diagram"],
			["source-based", "data-response"],
			["programming"],
			["mixed"],
		];

		const results: Question[] = [];
		const count = params.count;
		const itemCount = Math.max(1, Math.ceil(count / batches.length));

		for (const batch of batches) {
			if (results.length >= count) break;
			const available = batch.filter((t) => this.registry.hasProcessor(t));
			if (available.length === 0) continue;

			const primaryType = available[0];
			try {
				const processor = this.registry.getProcessor(primaryType);
				const typeParams = {
					...params,
					count: itemCount,
					questionType: primaryType,
				};
				const questions = await processor.generate(typeParams);
				results.push(...questions);
			} catch (error) {
				console.error(
					`[Engine] Batch generation failed for ${primaryType}:`,
					error,
				);
			}
		}

		return results.slice(0, params.count);
	}
}
