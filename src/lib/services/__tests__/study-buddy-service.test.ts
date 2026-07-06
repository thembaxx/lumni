import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { InMemoryDataAccess } from "@/lib/db";
import { StudyBuddyService } from "@/lib/services/study-buddy-service";

vi.mock("@/lib/shared/logger", () => ({ logError: () => {} }));

describe("StudyBuddyService", () => {
  let db: InMemoryDataAccess;
  let service: StudyBuddyService;

  beforeEach(() => {
    db = new InMemoryDataAccess();
    service = new StudyBuddyService({ db });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createCommitment", () => {
    test("creates a pending commitment", async () => {
      const commitment = await service.createCommitment("user-a", "user-b", "Mathematics", 30);

      expect(commitment.userId).toBe("user-a");
      expect(commitment.buddyUserId).toBe("user-b");
      expect(commitment.subject).toBe("Mathematics");
      expect(commitment.targetDailyMinutes).toBe(30);
      expect(commitment.status).toBe("pending");
      expect(commitment.sharedStreak).toBe(0);
      expect(commitment.id).toBeDefined();
    });

    test("creates commitment with default daily minutes", async () => {
      const commitment = await service.createCommitment("user-a", "user-b", "Physics");
      expect(commitment.targetDailyMinutes).toBe(30);
    });

    test("throws when duplicate active commitment exists", async () => {
      await service.createCommitment("user-a", "user-b", "Mathematics");
      await expect(service.createCommitment("user-a", "user-b", "Mathematics")).rejects.toThrow(
        "already exists",
      );
    });
  });

  describe("acceptCommitment", () => {
    test("accepts a pending commitment", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);

      const commitment = await service.acceptCommitment(id, "user-b");
      expect(commitment.status).toBe("active");
    });

    test("throws when wrong user tries to accept", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);

      await expect(service.acceptCommitment(id, "user-a")).rejects.toThrow("Only the invited user");
    });

    test("throws when commitment not in pending status", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);
      await service.acceptCommitment(id, "user-b");

      await expect(service.acceptCommitment(id, "user-b")).rejects.toThrow("not in pending status");
    });
  });

  describe("declineCommitment", () => {
    test("declines a pending commitment", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);

      await service.declineCommitment(id, "user-b");

      const records = await db.studyCommitments.where("id").equals(id).toArray();
      expect(records[0].status).toBe("declined");
    });

    test("throws when wrong user tries to decline", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);

      await expect(service.declineCommitment(id, "user-c")).rejects.toThrow(
        "Only the invited user",
      );
    });
  });

  describe("getCommitments", () => {
    test("returns commitments where user is creator or buddy", async () => {
      await service.createCommitment("user-a", "user-b", "Mathematics");
      await service.createCommitment("user-c", "user-a", "Physics");

      const commitments = await service.getCommitments("user-a");
      expect(commitments).toHaveLength(2);
    });

    test("returns empty array when user has no commitments", async () => {
      const commitments = await service.getCommitments("user-z");
      expect(commitments).toEqual([]);
    });
  });

  describe("endCommitment", () => {
    test("ends an active commitment", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);
      await service.acceptCommitment(id, "user-b");

      await service.endCommitment(id, "user-a");

      const records = await db.studyCommitments.toArray();
      const ended = records.find((r) => r.id === id);
      expect(ended?.status).toBe("ended");
      expect(ended?.endDate).toBeDefined();
    });

    test("throws when non-participant tries to end", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics");
      const id = Number(created.id);

      await expect(service.endCommitment(id, "user-c")).rejects.toThrow(
        "Only commitment participants",
      );
    });
  });

  describe("trackProgress and checkSharedStreaks", () => {
    test("trackProgress updates sharedStreak when both users study enough", async () => {
      const created = await service.createCommitment("user-a", "user-b", "Mathematics", 10);
      const id = Number(created.id);
      await service.acceptCommitment(id, "user-b");

      if (typeof globalThis !== "undefined") {
        const store: Record<string, string> = {};
        vi.stubGlobal("localStorage", {
          getItem: (k: string) => store[k] ?? null,
          setItem: (k: string, v: string) => {
            store[k] = v;
          },
          removeItem: (k: string) => {
            delete store[k];
          },
          clear: () => {
            for (const k of Object.keys(store)) delete store[k];
          },
          key: (i: number) => Object.keys(store)[i] ?? null,
          length: 0,
        });
        (globalThis as Record<string, unknown>).window = globalThis;
      }

      vi.stubGlobal("localStorage", globalThis.localStorage);

      await service.trackProgress("user-a", "Mathematics", 15);
      await service.trackProgress("user-b", "Mathematics", 12);

      const records = await db.studyCommitments.where("id").equals(id).toArray();
      expect(records[0].sharedStreak).toBe(1);
      expect(records[0].lastSharedDate).toBe(new Date().toDateString());

      vi.unstubAllGlobals();
    });
  });
});
