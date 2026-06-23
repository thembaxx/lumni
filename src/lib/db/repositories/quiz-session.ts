import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { safeJsonStringify } from "@/lib/shared/json";
import type { QuizAttempt, QuizSessionState } from "../schema";

export class QuizSessionRepository {
  constructor(private db: DataAccess) {}

  async saveQuizAttempt(
    odSubject: string,
    data: {
      answers: unknown[];
      score: number;
      maxScore?: number;
      totalQuestions: number;
      duration: number;
    },
    userId?: string,
  ): Promise<number> {
    return this.db.quizAttempts.add({
      odSubject,
      userId,
      answers: safeJsonStringify(data.answers),
      score: data.score,
      maxScore: data.maxScore,
      totalQuestions: data.totalQuestions,
      duration: data.duration,
      completedAt: Date.now(),
    });
  }

  async getQuizAttempts(odSubject: string, limit = 10): Promise<QuizAttempt[]> {
    return this.db.quizAttempts
      .where("odSubject")
      .equals(odSubject)
      .toReversed()
      .limit(limit)
      .toArray();
  }

  async save(session: Omit<QuizSessionState, "id" | "lastSavedAt">): Promise<number> {
    const existing = await this.db.quizSessions
      .where("sessionId")
      .equals(session.sessionId)
      .first();

    if (existing) {
      return this.db.quizSessions.update(existing.id ?? 0, {
        ...session,
        lastSavedAt: Date.now(),
      });
    }

    return this.db.quizSessions.add({
      ...session,
      lastSavedAt: Date.now(),
    });
  }

  async get(sessionId: string): Promise<QuizSessionState | undefined> {
    return this.db.quizSessions.where("sessionId").equals(sessionId).first();
  }

  async getActive(subject: string): Promise<QuizSessionState | undefined> {
    const sessions = await this.db.quizSessions.where("subject").equals(subject).toArray();

    const active = sessions.find((s) => !s.isPaused);
    if (active) return active;

    return sessions.reduce((a, b) => (a.lastSavedAt > b.lastSavedAt ? a : b));
  }

  async getAllPaused(): Promise<QuizSessionState[]> {
    const all = await this.db.quizSessions.toArray();
    return all.filter((s) => s.isPaused);
  }

  async resume(sessionId: string): Promise<QuizSessionState | undefined> {
    const session = await this.get(sessionId);
    if (!session) return undefined;

    await this.db.quizSessions.update(session.id ?? 0, {
      isPaused: false,
      lastSavedAt: Date.now(),
    });

    return { ...session, isPaused: false };
  }

  async pause(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (!session) return;

    await this.db.quizSessions.update(session.id ?? 0, {
      isPaused: true,
      lastSavedAt: Date.now(),
    });
  }

  async delete(sessionId: string): Promise<void> {
    await this.db.quizSessions.where("sessionId").equals(sessionId).delete();
  }

  async clearOld(maxAgeHours = 24): Promise<void> {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    await this.db.quizSessions.where("lastSavedAt").below(cutoff).delete();
  }
}

export function createQuizSessionRepository(db: DataAccess = dexieDataAccess) {
  return new QuizSessionRepository(db);
}
export const quizSessionRepo = createQuizSessionRepository();
