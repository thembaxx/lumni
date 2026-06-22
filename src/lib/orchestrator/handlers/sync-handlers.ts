import { Query } from "appwrite";
import { COLLECTIONS, createDocument, listDocuments } from "@/lib/db/client";
import type { FlashcardDataAccess, SyncDataAccess } from "@/lib/db/data-access";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";

type SyncHandlerDb = SyncDataAccess & Pick<FlashcardDataAccess, "flashcards">;

import { enqueue } from "@/lib/orchestrator/job-queue";
import type { JobPayloadByType } from "@/lib/orchestrator/types";
import { logError } from "@/lib/shared/logger";
import type { JobHandler } from "./index";
import { createAppendHandler, createDeleteHandler, createUpsertHandler } from "./sync-factory";

let _deps: { db: SyncHandlerDb } = { db: dexieDataAccess };
function __setDepsForTesting(deps: { db: SyncHandlerDb }) {
  _deps = deps;
}

const appwriteSync: JobHandler = async (payload) => {
  const { syncQuestionsToAppwrite } = await import("@/lib/question-engine/persistence");
  const data = payload as JobPayloadByType["appwrite-sync"];
  await syncQuestionsToAppwrite(data.questions, data.subject, data.topic);
};

const appwriteProgressSync = createUpsertHandler(
  COLLECTIONS.USER_PROGRESS,
  { userId: "userId", subjectId: "odSubjectId" },
  (data) => ({
    userId: data.userId as string,
    subjectId: data.odSubjectId as string,
    questionsAttempted: data.questionsAttempted as number,
    correctCount: data.correctCount as number,
    currentStreak: data.currentStreak as number,
    longestStreak: data.longestStreak as number,
  }),
);

const appwriteAttemptSync = createAppendHandler(COLLECTIONS.STUDY_SESSIONS, (data) => {
  const completedAt = data.completedAt as number;
  const duration = data.duration as number;
  return {
    userId: data.userId as string,
    subjectId: data.subjectId as string,
    questionsAnswered: data.totalQuestions as number,
    correctCount: data.score as number,
    duration: duration,
    startedAt: new Date(completedAt - duration * 1000).toISOString(),
    endedAt: new Date(completedAt).toISOString(),
  };
});

const appwriteCompetencySync = createUpsertHandler(
  COLLECTIONS.COMPETENCIES,
  { subjectId: "subjectId", topicId: "topicId", bloomLevel: "bloomLevel" },
  (data) => ({
    userId: data.userId as string,
    subjectId: data.subjectId as string,
    topicId: data.topicId as string,
    bloomLevel: data.bloomLevel as string,
    score: data.proficiency as number,
    attempts: data.attempts as number,
    level: data.level as string,
    lastAssessed: data.lastAssessed as number,
  }),
);

const appwriteFlashcardSync = createUpsertHandler(
  COLLECTIONS.FLASHCARDS,
  { flashcardId: "id" },
  (data) => ({
    userId: data.userId as string,
    flashcardId: data.id as string,
    front: data.front as string,
    back: data.back as string,
    subject: data.subject as string,
    topic: (data.topic as string) || "",
    easeFactor: data.easeFactor as number,
    interval: data.interval as number,
    repetitions: data.repetitions as number,
    nextReview: new Date(data.nextReview as number).toISOString(),
    lastReview: data.lastReview ? new Date(data.lastReview as number).toISOString() : null,
    createdAt: new Date(data.createdAt as number).toISOString(),
    updatedAt: new Date(data.updatedAt as number).toISOString(),
  }),
);

const appwriteFlashcardPull: JobHandler = async (payload) => {
  const _data = payload as JobPayloadByType["appwrite-flashcard-pull"];
  try {
    let lastSync = 0;
    if (typeof window !== "undefined") {
      try {
        const state = await _deps.db.flashcardSyncState.get("default");
        lastSync = state?.lastSyncTimestamp ?? 0;
      } catch (e) {
        logError("SyncHandler.flashcardSyncState", e);
        const legacy = localStorage.getItem("lumni_flashcard_last_sync");
        lastSync = Number.parseInt(legacy ?? "0", 10) || 0;
      }
    }

    const remoteCards = await listDocuments<Record<string, unknown>>(
      COLLECTIONS.FLASHCARDS,
      lastSync > 0 ? [Query.greaterThan("updatedAt", new Date(lastSync).toISOString())] : [],
    );

    await Promise.all(
      remoteCards.map(async (remote) => {
        const remoteUpdatedAt = new Date((remote.updatedAt as string) || 0).getTime();
        const localCard = await _deps.db.flashcards.get(remote.flashcardId as string);

        if (localCard?.updatedAt && localCard.updatedAt > remoteUpdatedAt) {
          return;
        }

        await _deps.db.flashcards.put({
          id: remote.flashcardId as string,
          front: (remote.front as string) || "",
          back: (remote.back as string) || "",
          subject: (remote.subject as string) || "",
          topic: (remote.topic as string) || undefined,
          easeFactor: (remote.easeFactor as number) || 2.5,
          interval: (remote.interval as number) || 0,
          repetitions: (remote.repetitions as number) || 0,
          nextReview: new Date((remote.nextReview as string) || Date.now()).getTime(),
          lastReview: remote.lastReview ? new Date(remote.lastReview as string).getTime() : null,
          createdAt: new Date((remote.createdAt as string) || Date.now()).getTime(),
          updatedAt: remoteUpdatedAt || Date.now(),
          algorithm: (remote.algorithm as "sm2" | "fsrs") || "fsrs",
          stability: (remote.stability as number) || 0,
          difficulty: (remote.difficulty as number) || 5,
          status: (remote.status as "active" | "buried" | "suspended") || "active",
          lapses: (remote.lapses as number) || 0,
          learningStep: (remote.learningStep as number) || -1,
          leeched: (remote.leeched as boolean) || false,
        });
      }),
    );

    if (typeof window !== "undefined") {
      try {
        await _deps.db.flashcardSyncState.put({
          userId: "default",
          lastSyncTimestamp: Date.now(),
        });
      } catch (e) {
        logError("SyncHandler.flashcardSyncSave", e);
        localStorage.setItem("lumni_flashcard_last_sync", String(Date.now()));
      }
    }
  } catch (e) {
    console.warn("[FlashcardPull] sync failed:", e);
  }
};

const appwriteFlashcardDelete = createDeleteHandler(COLLECTIONS.FLASHCARDS, {
  flashcardId: "id",
});

const appwriteWrongAnswerSync = createAppendHandler(COLLECTIONS.WRONG_ANSWERS, (data) => ({
  userId: data.userId as string,
  questionId: data.questionId as string,
  questionText: data.questionText as string,
  subject: data.subject as string,
  topic: data.topic as string,
  correctAnswer: data.correctAnswer as string,
  userAnswer: data.userAnswer as string,
  explanation: data.explanation as string,
  errorType: (data.errorType as string) || "unknown",
  reviewed: data.reviewed as boolean,
  createdAt: new Date(data.createdAt as number).toISOString(),
}));

const appwriteChatSync = createAppendHandler(COLLECTIONS.CHAT_MESSAGES, (data) => ({
  userId: data.userId as string,
  messageId: data.messageId as string,
  role: data.role as string,
  content: data.content as string,
  type: (data.type as string) || "",
  createdAt: new Date(data.timestamp as number).toISOString(),
}));

const appwriteRatingSync: JobHandler = async (payload) => {
  const data = payload as JobPayloadByType["appwrite-rating-sync"];
  await createDocument(COLLECTIONS.QUESTIONS, {
    type: "rating",
    questionId: data.questionId,
    subject: data.subject,
    rating: data.rating,
    feedback: data.feedback,
    createdAt: new Date(data.createdAt).toISOString(),
  });

  const ratings = await listDocuments<Record<string, unknown>>(COLLECTIONS.QUESTIONS, [
    Query.equal("questionId", data.questionId),
    Query.equal("type", "rating"),
  ]);

  if (ratings.length >= 3) {
    const avgRating =
      ratings.reduce((sum, r) => sum + ((r.rating as number) || 0), 0) / ratings.length;
    if (avgRating < 2) {
      await enqueue("question-regen", {
        questionId: data.questionId,
        subject: data.subject,
      });
    }
  }
};

const appwriteStudyPlanSync = createUpsertHandler(
  COLLECTIONS.STUDY_PLANS,
  { userId: "userId" },
  (data) => ({
    userId: data.userId as string,
    planData: JSON.stringify(data.sessions),
    examDates: JSON.stringify(data.examDates),
    generatedAt: new Date(data.generatedAt as number).toISOString(),
  }),
);

const appwriteQuestionFlag = createAppendHandler(COLLECTIONS.QUESTION_FLAGS, (data) => ({
  questionId: data.questionId as string,
  userId: data.userId as string,
  reason: data.reason as string,
  details: (data.details as string) || "",
  status: "pending",
  createdAt: new Date(data.createdAt as number).toISOString(),
}));

const appwriteBookmarkSync = createUpsertHandler(
  COLLECTIONS.BOOKMARKS,
  { questionId: "questionId" },
  (data) => ({
    userId: (data.userId as string) || "",
    questionId: data.questionId as string,
    questionText: data.questionText as string,
    subject: data.subject as string,
    topic: (data.topic as string) || "",
    note: (data.note as string) || "",
    savedAt: new Date(data.savedAt as number).toISOString(),
  }),
);

const appwriteBookmarkDelete = createDeleteHandler(COLLECTIONS.BOOKMARKS, {
  questionId: "questionId",
});

const appwriteExamDatesSync = createUpsertHandler(
  COLLECTIONS.EXAM_DATES,
  { cacheKey: "cacheKey" },
  (data) => ({
    cacheKey: data.cacheKey as string,
    session: data.session as string,
    year: data.year as number,
    slots: data.slots as string,
    source: data.source as string,
  }),
);

const appwriteConsentSync = createUpsertHandler(
  COLLECTIONS.USER_CONSENTS,
  { userId: "userId" },
  (data) => ({
    userId: data.userId as string,
    analytics: (data.record as Record<string, unknown>).analytics as boolean,
    marketing: (data.record as Record<string, unknown>).marketing as boolean,
    dataSharing: (data.record as Record<string, unknown>).dataSharing as boolean,
    tosVersion: ((data.record as Record<string, unknown>).tosVersion as string) || "",
    tosAcceptedAt: ((data.record as Record<string, unknown>).tosAcceptedAt as string) || "",
    privacyVersion: ((data.record as Record<string, unknown>).privacyVersion as string) || "",
    privacyAcknowledgedAt:
      ((data.record as Record<string, unknown>).privacyAcknowledgedAt as string) || "",
    updatedAt: (data.record as Record<string, unknown>).updatedAt as string,
    createdAt: (data.record as Record<string, unknown>).createdAt as string,
  }),
);

const appwriteSharedQuestionSync: JobHandler = async (payload) => {
  const data = payload as JobPayloadByType["appwrite-shared-question-sync"];
  await createDocument(COLLECTIONS.SHARED_QUESTIONS, data);
};

const appwriteVisualSync: JobHandler = async (payload) => {
  const data = payload as JobPayloadByType["appwrite-visual-sync"];
  await createDocument(COLLECTIONS.VISUALS, {
    questionId: data.questionId,
    subject: data.subject,
    visual: data.visual,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });
};

export const appwriteHandlers: Partial<Record<string, JobHandler>> = {
  "appwrite-exam-dates-sync": appwriteExamDatesSync,
  "appwrite-sync": appwriteSync,
  "appwrite-progress-sync": appwriteProgressSync,
  "appwrite-attempt-sync": appwriteAttemptSync,
  "appwrite-competency-sync": appwriteCompetencySync,
  "appwrite-flashcard-sync": appwriteFlashcardSync,
  "appwrite-flashcard-pull": appwriteFlashcardPull,
  "appwrite-flashcard-delete": appwriteFlashcardDelete,
  "appwrite-wrong-answer-sync": appwriteWrongAnswerSync,
  "appwrite-bookmark-sync": appwriteBookmarkSync,
  "appwrite-bookmark-delete": appwriteBookmarkDelete,
  "appwrite-chat-sync": appwriteChatSync,
  "appwrite-rating-sync": appwriteRatingSync,
  "appwrite-study-plan-sync": appwriteStudyPlanSync,
  "appwrite-question-flag": appwriteQuestionFlag,
  "appwrite-consent-sync": appwriteConsentSync,
  "appwrite-shared-question-sync": appwriteSharedQuestionSync,
  "appwrite-visual-sync": appwriteVisualSync,
};
