import type { StudyCommitmentsDataAccess } from "@/lib/db";
import type { StudyCommitmentRecord } from "@/lib/db/types";
import type { StudyCommitment } from "@/lib/services/study-commitment-types";
import { logError } from "@/lib/shared/logger";

function toModel(record: StudyCommitmentRecord): StudyCommitment {
  return {
    id: String(record.id),
    userId: record.userId,
    buddyUserId: record.buddyUserId,
    subject: record.subject,
    targetDailyMinutes: record.targetDailyMinutes,
    startDate: record.startDate,
    endDate: record.endDate,
    status: record.status,
    sharedStreak: record.sharedStreak,
    lastSharedDate: record.lastSharedDate,
    createdAt: record.createdAt,
  };
}

export class StudyBuddyService {
  constructor(private deps: { db: StudyCommitmentsDataAccess }) {}

  async createCommitment(
    userId: string,
    buddyUserId: string,
    subject: string,
    targetDailyMinutes: number = 30,
  ): Promise<StudyCommitment> {
    const existing = await this.deps.db.studyCommitments
      .where("userId")
      .equals(userId)
      .filter(
        (c) =>
          c.buddyUserId === buddyUserId &&
          c.subject === subject &&
          (c.status === "pending" || c.status === "active"),
      )
      .toArray();

    if (existing.length > 0) {
      throw new Error(
        "An active or pending commitment already exists with this buddy for this subject",
      );
    }

    const record: Omit<StudyCommitmentRecord, "id"> = {
      userId,
      buddyUserId,
      subject,
      targetDailyMinutes,
      startDate: new Date().toISOString(),
      endDate: null,
      status: "pending",
      sharedStreak: 0,
      lastSharedDate: null,
      createdAt: new Date().toISOString(),
    };

    const id = await this.deps.db.studyCommitments.add(record);
    return toModel({ ...record, id });
  }

  async acceptCommitment(commitmentId: number, userId: string): Promise<StudyCommitment> {
    const record = await this.deps.db.studyCommitments.get(commitmentId);
    if (!record) throw new Error("Commitment not found");
    if (record.buddyUserId !== userId)
      throw new Error("Only the invited user can accept this commitment");
    if (record.status !== "pending") throw new Error("Commitment is not in pending status");

    await this.deps.db.studyCommitments.update(commitmentId, { status: "active" });
    const updated = await this.deps.db.studyCommitments.get(commitmentId);
    return toModel(updated!);
  }

  async declineCommitment(commitmentId: number, userId: string): Promise<void> {
    const record = await this.deps.db.studyCommitments.get(commitmentId);
    if (!record) throw new Error("Commitment not found");
    if (record.buddyUserId !== userId)
      throw new Error("Only the invited user can decline this commitment");
    if (record.status !== "pending") throw new Error("Commitment is not in pending status");

    await this.deps.db.studyCommitments.update(commitmentId, { status: "declined" });
  }

  async getCommitments(userId: string): Promise<StudyCommitment[]> {
    const records = await this.deps.db.studyCommitments
      .where("userId")
      .equals(userId)
      .filter((c) => c.status === "pending" || c.status === "active" || c.status === "ended")
      .toArray();

    const buddyRecords = await this.deps.db.studyCommitments
      .where("buddyUserId")
      .equals(userId)
      .filter((c) => c.status === "pending" || c.status === "active" || c.status === "ended")
      .toArray();

    const all = [...records, ...buddyRecords];
    const seen = new Set<number>();
    const unique: StudyCommitment[] = [];

    for (const r of all) {
      const key = r.id ?? 0;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(toModel(r));
      }
    }

    return unique.toSorted(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async endCommitment(commitmentId: number, userId: string): Promise<void> {
    const record = await this.deps.db.studyCommitments.get(commitmentId);
    if (!record) throw new Error("Commitment not found");
    if (record.userId !== userId && record.buddyUserId !== userId) {
      throw new Error("Only commitment participants can end it");
    }

    await this.deps.db.studyCommitments.update(commitmentId, {
      status: "ended",
      endDate: new Date().toISOString(),
    });
  }

  async trackProgress(userId: string, subject: string, minutesStudied: number): Promise<void> {
    const commitments = await this.deps.db.studyCommitments
      .where("status")
      .equals("active")
      .filter((c) => (c.userId === userId || c.buddyUserId === userId) && c.subject === subject)
      .toArray();

    for (const commitment of commitments) {
      const id = commitment.id!;
      const today = new Date().toDateString();
      const otherUserId = commitment.userId === userId ? commitment.buddyUserId : commitment.userId;

      const streakKey = `shared_streak_${commitment.id}_${today}`;
      const todayProgress =
        typeof window !== "undefined"
          ? (JSON.parse(localStorage.getItem(streakKey) ?? "{}") as Record<string, number>)
          : {};

      todayProgress[userId] = (todayProgress[userId] ?? 0) + minutesStudied;

      if (typeof window !== "undefined") {
        localStorage.setItem(streakKey, JSON.stringify(todayProgress));
      }

      const otherMinutes = todayProgress[otherUserId] ?? 0;

      if (
        otherMinutes >= commitment.targetDailyMinutes &&
        todayProgress[userId] >= commitment.targetDailyMinutes
      ) {
        const lastShared = commitment.lastSharedDate
          ? new Date(commitment.lastSharedDate).toDateString()
          : null;
        let newStreak = commitment.sharedStreak;

        if (lastShared !== today) {
          if (lastShared) {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            if (lastShared === yesterday.toDateString()) {
              newStreak += 1;
            } else {
              newStreak = 1;
            }
          } else {
            newStreak = 1;
          }
        }

        await this.deps.db.studyCommitments.update(id, {
          sharedStreak: newStreak,
          lastSharedDate: today,
        });
      }
    }
  }

  async checkSharedStreaks(): Promise<void> {
    try {
      const active = await this.deps.db.studyCommitments.where("status").equals("active").toArray();

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toDateString();

      for (const commitment of active) {
        const lastShared = commitment.lastSharedDate
          ? new Date(commitment.lastSharedDate).toDateString()
          : null;
        if (lastShared !== yesterdayStr) {
          const id = commitment.id!;
          await this.deps.db.studyCommitments.update(id, { sharedStreak: 0 });
        }
      }
    } catch (err) {
      logError("StudyBuddyService.checkSharedStreaks", err);
    }
  }
}
