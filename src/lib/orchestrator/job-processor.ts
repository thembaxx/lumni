import { curriculumRegistry } from "@/curriculum";
import { competencyService, computeBloomWeight } from "@/lib/competency-engine";
import { syncQuestionsToAppwrite } from "@/lib/question-engine/persistence";
import type { Question } from "@/lib/question-engine/types";
import type { ProcessResult } from "@/lib/queue/core";
import { analyticsService } from "@/lib/services/analytics-service";
import { progressService } from "@/lib/services/progress-service";
import { spacedRepService } from "@/lib/services/spaced-rep-service";
import { visualEngine } from "@/lib/visual-engine/visual-engine";
import { queueCore } from "./job-queue";
import type { JobRecord, JobType } from "./types";

type JobHandler = (payload: unknown) => Promise<void>;

const handlers: Record<JobType, JobHandler> = {
	"appwrite-sync": async (payload) => {
		const { questions, subject, topic } = payload as {
			questions: Question[];
			subject: string;
			topic?: string;
		};
		await syncQuestionsToAppwrite(questions, subject, topic);
	},

	"analytics-sync": async (payload) => {
		const { events } = payload as { events: unknown[] };
		await analyticsService.sync(events);
	},

	"spaced-rep-update": async (payload) => {
		const { question, result } = payload as {
			question: Question;
			result: { correct: boolean; score: number };
		};
		await spacedRepService.update(question, result);
	},

	"progress-update": async (payload) => {
		const { subject, result } = payload as {
			subject: string;
			result: { correct: boolean; score: number };
		};
		await progressService.update(subject, result);
	},

	"competency-update": async (payload) => {
		const { subject, topic, bloomLevel, score } = payload as {
			subject: string;
			topic: string;
			bloomLevel: string;
			score: number;
		};

		const curriculum = await curriculumRegistry.getSubject(subject);
		const weight = computeBloomWeight(curriculum, topic, bloomLevel);

		await competencyService.update(
			subject,
			topic,
			bloomLevel as import("@/lib/question-engine/types").BloomLevel,
			score,
			weight,
		);
	},

	"visual-generation": async (payload) => {
		const { questionId, questionText, subject, topic } = payload as {
			questionId: string;
			questionText: string;
			subject: string;
			topic?: string;
		};
		await visualEngine.resolve({
			questionId,
			questionText,
			subject,
			topic: topic ?? "",
		});
	},
};

export class JobProcessor {
	private concurrencyGuard = { isProcessing: false };

	async processBatch(limit = 5): Promise<ProcessResult> {
		return queueCore.processBatch(
			async (job: JobRecord) => {
				const handler = handlers[job.type];
				if (!handler) throw new Error(`No handler for type: ${job.type}`);
				const payload = JSON.parse(job.payload);
				await handler(payload);
			},
			limit,
			this.concurrencyGuard,
		);
	}
}

export const jobProcessor = new JobProcessor();
