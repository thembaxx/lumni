import { enqueue } from "@/lib/orchestrator/job-queue";
import type { JobPayloadByType, JobType } from "@/lib/orchestrator/types";
import { logError } from "@/lib/shared/logger";

/**
 * SyncManager — unified facade for all Dexie→Appwrite sync operations.
 * Every domain calls `syncManager.enqueue()` instead of writing to Appwrite inline.
 */

type SyncOp<T extends JobType> = { type: T; payload: JobPayloadByType[T] };

export type SyncOperation =
  | SyncOp<"appwrite-progress-sync">
  | SyncOp<"appwrite-attempt-sync">
  | SyncOp<"appwrite-competency-sync">
  | SyncOp<"appwrite-flashcard-sync">
  | SyncOp<"appwrite-flashcard-delete">
  | SyncOp<"appwrite-wrong-answer-sync">
  | SyncOp<"appwrite-chat-sync">
  | SyncOp<"appwrite-bookmark-delete">
  | SyncOp<"appwrite-rating-sync">
  | SyncOp<"appwrite-study-plan-sync">
  | SyncOp<"appwrite-consent-sync">
  | SyncOp<"appwrite-shared-question-sync">
  | SyncOp<"appwrite-visual-sync">
  | SyncOp<"appwrite-exam-dates-sync">
  | SyncOp<"appwrite-question-flag">;

export const syncManager = {
  enqueue(op: SyncOperation): void {
    enqueue(op.type, op.payload).catch((err) => logError("SyncManagerEnqueue", err));
  },

  flushAll: async (userId: string): Promise<void> => {
    const { flushOfflineData } = await import("./sync-handler");
    await flushOfflineData(userId);
  },
};
