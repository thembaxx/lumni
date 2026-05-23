import type { ProcessResult } from "@/lib/queue/core";
import { getHandler } from "./handlers";
import { queueCore } from "./job-queue";
import type { JobRecord } from "./types";

export class JobProcessor {
	private concurrencyGuard = { isProcessing: false };

	async processBatch(limit = 5): Promise<ProcessResult> {
		return queueCore.processBatch(
			async (job: JobRecord) => {
				const handler = getHandler(job.type);
				const payload = JSON.parse(job.payload);
				await handler(payload);
			},
			limit,
			this.concurrencyGuard,
		);
	}
}

export const jobProcessor = new JobProcessor();
