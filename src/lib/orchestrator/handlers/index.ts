import type { JobType } from "@/lib/orchestrator/types";
import { domainHandlers } from "./domain";
import { appwriteHandlers } from "./sync-handlers";

export type JobHandler = (payload: unknown) => Promise<void>;

const registry: Partial<Record<JobType, JobHandler>> = {
  ...appwriteHandlers,
  ...domainHandlers,
};

export function getHandler(type: JobType): JobHandler {
  const handler = registry[type];
  if (!handler) throw new Error(`No handler registered for job type: ${type}`);
  return handler;
}
