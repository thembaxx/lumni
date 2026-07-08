import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import type { DataAccess } from "@/lib/db/data-access";
import type { QuizSessionState } from "@/lib/db/schema";

export class QuizSessionRepository {
  constructor(
    private _db: { quizSessions: typeof dexieDataAccess.quizSessions } = dexieDataAccess,
  ) {}

  private get db() {
    return this._db.quizSessions;
  }

  async save(data: Omit<QuizSessionState, "id" | "lastSavedAt">): Promise<void> {
    const existing = data.sessionId
      ? await this.db.where("sessionId").equals(data.sessionId).first()
      : undefined;
    const entry: QuizSessionState = { ...data, lastSavedAt: Date.now() };
    if (existing?.id != null) {
      await this.db.update(existing.id, entry);
    } else {
      await this.db.add(entry);
    }
  }

  async get(sessionId: string): Promise<QuizSessionState | undefined> {
    return this.db.where("sessionId").equals(sessionId).first();
  }

  async getActive(subject: string): Promise<QuizSessionState | undefined> {
    const sessions = await this.db.where("subject").equals(subject).toArray();
    const active = sessions.find((s) => !s.isPaused);
    if (active) return active;
    return sessions.reduce((a, b) => (a.lastSavedAt > b.lastSavedAt ? a : b));
  }

  async getAllPaused(): Promise<QuizSessionState[]> {
    const all = await this.db.toArray();
    return all.filter((s) => s.isPaused);
  }

  async resume(sessionId: string): Promise<QuizSessionState | undefined> {
    const session = await this.get(sessionId);
    if (!session) return undefined;
    if (session.id != null) {
      await this.db.update(session.id, { isPaused: false, lastSavedAt: Date.now() });
    }
    return { ...session, isPaused: false };
  }

  async pause(sessionId: string): Promise<void> {
    const session = await this.get(sessionId);
    if (session?.id != null) {
      await this.db.update(session.id, { isPaused: true, lastSavedAt: Date.now() });
    }
  }

  async delete(sessionId: string): Promise<void> {
    await this.db.where("sessionId").equals(sessionId).delete();
  }

  async clearOld(maxAgeHours: number): Promise<void> {
    const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
    await this.db.where("lastSavedAt").below(cutoff).delete();
  }
}

export const quizSessionRepo = new QuizSessionRepository();
