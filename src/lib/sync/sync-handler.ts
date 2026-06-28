import { type DataAccess, dexieDataAccess } from "@/lib/db";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { logError } from "@/lib/shared/logger";

let _deps: { db: DataAccess } = Object.freeze({ db: dexieDataAccess });
export function __setDepsForTesting(deps: { db: DataAccess }) {
  _deps = Object.freeze({ ...deps });
}

export async function flushOfflineData(userId: string): Promise<void> {
  const TABLES = [
    { name: "progress", toArray: () => _deps.db.progress.toArray() },
    { name: "quizAttempts", toArray: () => _deps.db.quizAttempts.toArray() },
    { name: "competencies", toArray: () => _deps.db.competencies.toArray() },
    { name: "flashcards", toArray: () => _deps.db.flashcards.toArray() },
    { name: "wrongAnswers", toArray: () => _deps.db.wrongAnswers.toArray() },
    { name: "chatMessages", toArray: () => _deps.db.chatMessages.toArray() },
    {
      name: "questionRatings",
      toArray: () => _deps.db.questionRatings.toArray(),
    },
    { name: "bookmarks", toArray: () => _deps.db.bookmarks.toArray() },
  ];

  for (const table of TABLES) {
    try {
      const records = await table.toArray();
      await processTable(table.name, records, userId);
    } catch (e) {
      logError(`SyncHandler.${table.name}`, e);
    }
  }
}

async function processTable(name: string, records: unknown[], userId: string): Promise<void> {
  switch (name) {
    case "progress":
      await Promise.all(
        records.flatMap((p) => {
          const rec = p as {
            odSubjectId?: string;
            questionsAttempted: number;
            correctCount: number;
            currentStreak: number;
            longestStreak: number;
          };
          return rec.odSubjectId && (rec.questionsAttempted > 0 || rec.correctCount > 0)
            ? [
                enqueue("appwrite-progress-sync", {
                  userId,
                  odSubjectId: rec.odSubjectId,
                  questionsAttempted: rec.questionsAttempted,
                  correctCount: rec.correctCount,
                  currentStreak: rec.currentStreak,
                  longestStreak: rec.longestStreak,
                }),
              ]
            : [];
        }),
      );
      break;
    case "quizAttempts":
      await Promise.all(
        records.flatMap((a) => {
          const rec = a as {
            userId?: string;
            odSubject: string;
            score: number;
            totalQuestions: number;
            duration: number;
            completedAt: number;
            id?: number;
          };
          return !rec.userId
            ? [
                enqueue("appwrite-attempt-sync", {
                  userId,
                  subjectId: rec.odSubject,
                  score: rec.score,
                  totalQuestions: rec.totalQuestions,
                  duration: rec.duration,
                  completedAt: rec.completedAt,
                }).then(() => _deps.db.quizAttempts.update(rec.id ?? 0, { userId })),
              ]
            : [];
        }),
      );
      break;
    case "competencies":
      await Promise.all(
        records.map((c) => {
          const rec = c as {
            subjectId: string;
            topicId: string;
            bloomLevel: string;
            score: number;
            attempts: number;
            level: string;
            lastAssessed: number;
          };
          return enqueue("appwrite-competency-sync", {
            userId,
            subjectId: rec.subjectId,
            topicId: rec.topicId,
            bloomLevel: rec.bloomLevel,
            proficiency: rec.score,
            attempts: rec.attempts,
            level: rec.level,
            lastAssessed: rec.lastAssessed,
          });
        }),
      );
      break;
    case "flashcards":
      await Promise.all(
        records.map((f) => {
          const rec = f as {
            id: string;
            front: string;
            back: string;
            subject: string;
            topic: string;
            easeFactor: number;
            interval: number;
            repetitions: number;
            nextReview: number;
            lastReview: number | null;
            createdAt: number;
            updatedAt: number;
          };
          return enqueue("appwrite-flashcard-sync", {
            userId,
            id: rec.id,
            front: rec.front,
            back: rec.back,
            subject: rec.subject,
            topic: rec.topic,
            easeFactor: rec.easeFactor,
            interval: rec.interval,
            repetitions: rec.repetitions,
            nextReview: rec.nextReview,
            lastReview: rec.lastReview,
            createdAt: rec.createdAt,
            updatedAt: rec.updatedAt,
          });
        }),
      );
      break;
    case "wrongAnswers":
      await Promise.all(
        records.map((w) => {
          const rec = w as {
            questionId: string;
            questionText: string;
            subject: string;
            topic: string;
            correctAnswer: string;
            userAnswer: string;
            explanation: string;
            createdAt: number;
            reviewed: boolean;
            errorType: string;
          };
          return enqueue("appwrite-wrong-answer-sync", {
            userId,
            questionId: rec.questionId,
            questionText: rec.questionText,
            subject: rec.subject,
            topic: rec.topic,
            correctAnswer: rec.correctAnswer,
            userAnswer: rec.userAnswer,
            explanation: rec.explanation,
            createdAt: rec.createdAt,
            reviewed: rec.reviewed,
            errorType: rec.errorType,
          });
        }),
      );
      break;
    case "chatMessages":
      await Promise.all(
        records.map((m) => {
          const rec = m as {
            messageId: string;
            role: string;
            content: string;
            type: string;
            timestamp: number;
          };
          return enqueue("appwrite-chat-sync", {
            userId,
            messageId: rec.messageId,
            role: rec.role,
            content: rec.content,
            type: rec.type,
            timestamp: rec.timestamp,
          });
        }),
      );
      break;
    case "questionRatings":
      await Promise.all(
        records.map((r) => {
          const rec = r as {
            questionId: string;
            subject: string;
            rating: number;
            feedback: string;
            createdAt: number;
          };
          return enqueue("appwrite-rating-sync", {
            questionId: rec.questionId,
            subject: rec.subject,
            rating: rec.rating,
            feedback: rec.feedback,
            createdAt: rec.createdAt,
          });
        }),
      );
      break;
    case "bookmarks":
      await Promise.all(
        records.map((b) => {
          const rec = b as {
            questionId: string;
            questionText: string;
            subject: string;
            topic: string;
            note: string;
            savedAt: number;
          };
          return enqueue("appwrite-bookmark-sync", {
            userId,
            questionId: rec.questionId,
            questionText: rec.questionText,
            subject: rec.subject,
            topic: rec.topic,
            note: rec.note,
            savedAt: rec.savedAt,
          });
        }),
      );
      break;
  }
}
