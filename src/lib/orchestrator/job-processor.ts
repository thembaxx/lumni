import { curriculumRegistry } from "@/curriculum";
import { competencyService } from "@/lib/competency-engine";
import { syncQuestionsToAppwrite } from "@/lib/question-engine/persistence";
import type { Question } from "@/lib/question-engine/types";
import { analyticsService } from "@/lib/services/analytics-service";
import { progressService } from "@/lib/services/progress-service";
import { spacedRepService } from "@/lib/services/spaced-rep-service";
import { jobQueue } from "./job-queue";
import type { JobRecord, JobType } from "./types";

type JobHandler = (payload: unknown) => Promise<void>;

const handlers: Record<JobType, JobHandler> = {
	"visual-pre-cache": async (payload) => {
		const { visualEngine } = await import("@/lib/visual-engine");
		const questions = payload as Question[];
		await Promise.allSettled(
			questions.map((q) =>
				visualEngine.resolve({
					questionId: q.id,
					questionText: q.questionText,
					subject: q.subject,
					topic: q.topic,
				}),
			),
		);
	},

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
		let weight = 1.0;

		if (curriculum) {
			const topicDef = curriculum.topics.find((t) => t.id === topic);
			if (topicDef) {
				const bloomOrder = [
					"remember",
					"understand",
					"apply",
					"analyze",
					"evaluate",
					"create",
				];
				const questionLevel = bloomOrder.indexOf(bloomLevel);
				const targetLevel = bloomOrder.indexOf(topicDef.bloomTarget);
				if (questionLevel > targetLevel) {
					weight = 0.5;
				}
			}
		}

		await competencyService.update(
			subject,
			topic,
			bloomLevel as import("@/lib/question-engine/types").BloomLevel,
			score,
			weight,
		);
	},
};

export class JobProcessor {
	private isProcessing = false;

	async processBatch(limit = 5): Promise<{
		processed: number;
		succeeded: number;
		failed: number;
	}> {
		if (this.isProcessing) return { processed: 0, succeeded: 0, failed: 0 };
		this.isProcessing = true;

		let succeeded = 0;
		let failed = 0;
		const processed: number[] = [];

		try {
			for (let i = 0; i < limit; i++) {
				const job = await jobQueue.next();
				if (!job || !job.id) break;

				processed.push(job.id);
				await jobQueue.markProcessing(job.id);

				try {
					const handler = handlers[job.type];
					if (!handler) {
						await jobQueue.markFailed(
							job.id,
							`No handler for type: ${job.type}`,
						);
						failed++;
						continue;
					}

					const payload = JSON.parse(job.payload);
					await handler(payload);
					await jobQueue.markCompleted(job.id);
					succeeded++;
				} catch (error) {
					const message =
						error instanceof Error ? error.message : "Unknown error";

					if (job.attempts + 1 >= job.maxRetries) {
						await jobQueue.markFailed(job.id, message);
						failed++;
					} else {
						await jobQueue.markForRetry(job.id, message);
					}
				}
			}
		} finally {
			this.isProcessing = false;
		}

		return {
			processed: processed.length,
			succeeded,
			failed,
		};
	}
}

export const jobProcessor = new JobProcessor();
