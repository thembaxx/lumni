import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

const mockGetPending = vi.fn();
const mockIncrementRetry = vi.fn();
const mockRemoveEntries = vi.fn();
const mockGetOutboxCount = vi.fn().mockResolvedValue(0);
const mockLogError = vi.fn();
const mockInitWriters = vi.fn();

vi.mock("@/lib/sync/outbox", () => ({
  getPendingOutboxEntries: mockGetPending,
  incrementRetry: mockIncrementRetry,
  removeOutboxEntries: mockRemoveEntries,
  getOutboxCount: mockGetOutboxCount,
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: mockLogError,
}));

vi.mock("@/lib/sync/sync-writer", () => ({
  initSyncWriters: mockInitWriters,
}));

const dexieMock = {
  syncCheckpoints: {
    toArray: vi.fn().mockResolvedValue([]),
    put: vi.fn(),
  },
  flashcards: { put: vi.fn(), get: vi.fn() },
  notes: { put: vi.fn(), get: vi.fn() },
  competencies: { put: vi.fn(), get: vi.fn() },
  gamification: { put: vi.fn(), get: vi.fn() },
  retentionRecurrence: { put: vi.fn(), get: vi.fn() },
  wrongAnswers: { put: vi.fn(), get: vi.fn() },
  chatMessages: { put: vi.fn(), get: vi.fn() },
  questionRatings: { put: vi.fn(), get: vi.fn() },
  bookmarks: { put: vi.fn(), get: vi.fn() },
  examSessions: { put: vi.fn(), get: vi.fn() },
  quizAttempts: { put: vi.fn(), get: vi.fn() },
  studyPlans: { put: vi.fn(), get: vi.fn() },
  studyGuides: { put: vi.fn(), get: vi.fn() },
  vocabularyList: { put: vi.fn(), get: vi.fn() },
  pronunciationHistory: { put: vi.fn(), get: vi.fn() },
  storyCache: { put: vi.fn(), get: vi.fn() },
  storyQuestions: { put: vi.fn(), get: vi.fn() },
};

vi.mock("@/lib/db/dexie-data-access", () => ({
  dexieDataAccess: dexieMock,
}));

vi.stubGlobal("location", { href: "http://localhost" });

const { createSyncService } = await import("../service");

describe("SyncService", () => {
  const originalFetch = globalThis.fetch;
  let mockFetch: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch = vi.fn();
    globalThis.fetch = mockFetch;
    mockGetPending.mockReset();
    mockIncrementRetry.mockReset();
    mockRemoveEntries.mockReset();
    mockInitWriters.mockReset();
    mockLogError.mockReset();

    mockGetPending.mockResolvedValue([]);
    mockInitWriters.mockResolvedValue(undefined);

    Object.values(dexieMock).forEach((t: unknown) => {
      const table = t as Record<string, Mock>;
      if (table.put) table.put.mockReset();
      if (table.get) table.get.mockReset();
    });
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("status()", () => {
    it("should return idle state initially", () => {
      const service = createSyncService(() => "user-1");
      const status = service.status();
      expect(status.state).toBe("idle");
      expect(status.pendingWrites).toBe(0);
      expect(status.lastSyncAt).toBeNull();
      expect(status.lastError).toBeNull();
    });
  });

  describe("trigger()", () => {
    it("should return empty result when no user", async () => {
      const service = createSyncService(() => null);
      const result = await service.trigger();
      expect(result.pushed).toBe(0);
      expect(result.pulled).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it("should skip when already syncing", async () => {
      const service = createSyncService(() => "user-1");
      mockGetPending.mockResolvedValue([]);
      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ records: [], version: "v1" }) });

      const first = service.trigger();
      const second = service.trigger();

      const [r1, r2] = await Promise.all([first, second]);
      expect(r1.pushed).toBe(0);
      expect(r2.pushed).toBe(0);
    });

    it("should notify listeners on state changes", async () => {
      const service = createSyncService(() => "user-1");
      const states: string[] = [];
      service.onStatusChange((s) => states.push(s.state));

      mockGetPending.mockResolvedValue([]);
      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ records: [], version: "v1" }) });

      await service.trigger();

      expect(states).toContain("syncing");
      expect(states).toContain("idle");
    });

    it("should set error state when push fails", async () => {
      const service = createSyncService(() => "user-1");

      mockGetPending.mockResolvedValue([
        {
          id: 1,
          table: "flashcards",
          recordId: "fc-1",
          operation: "update",
          data: "{}",
          createdAt: 1,
          retries: 0,
        },
      ]);
      mockFetch.mockRejectedValue(new Error("Network error"));
      mockGetPending.mockClear();

      const result = await service.trigger();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(service.status().state).toBe("error");
      expect(service.status().lastError).toBeTruthy();
    });
  });

  describe("pushOutbox", () => {
    it("should push entries and remove on success", async () => {
      const service = createSyncService(() => "user-1");

      mockGetPending.mockResolvedValue([
        {
          id: 1,
          table: "flashcards",
          recordId: "fc-1",
          operation: "update",
          data: JSON.stringify({ front: "hello" }),
          createdAt: 1,
          retries: 0,
        },
      ]);
      mockFetch.mockResolvedValueOnce({ ok: true });

      const result = await service.trigger();

      expect(result.pushed).toBe(1);
      expect(mockFetch).toHaveBeenCalledWith(
        "/api/sync/push",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("flashcards"),
        }),
      );
      expect(mockRemoveEntries).toHaveBeenCalledWith([1]);
    });

    it("should retry on server error", async () => {
      const service = createSyncService(() => "user-1");

      mockGetPending.mockResolvedValue([
        {
          id: 1,
          table: "notes",
          recordId: "n-1",
          operation: "create",
          data: "{}",
          createdAt: 1,
          retries: 0,
        },
      ]);
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      mockIncrementRetry.mockResolvedValue(undefined);

      await service.trigger();

      expect(mockIncrementRetry).toHaveBeenCalledWith(1);
      expect(mockRemoveEntries).not.toHaveBeenCalled();
    });
  });

  describe("pullRemote", () => {
    it("should pull records and apply LWW resolution", async () => {
      const service = createSyncService(() => "user-1");

      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);

      const remoteRecord = { id: "fc-1", front: "remote front", updatedAt: "2026-07-15T10:00:00Z" };
      const localRecord = { id: "fc-1", front: "local front", updatedAt: "2026-07-15T09:00:00Z" };

      dexieMock.flashcards.get.mockResolvedValue(localRecord);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ records: [remoteRecord], version: "v2" }),
      });

      await service.trigger();

      expect(dexieMock.flashcards.put).toHaveBeenCalledWith(remoteRecord);
    });

    it("should keep local when it is newer", async () => {
      const service = createSyncService(() => "user-1");

      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);

      const remoteRecord = { id: "fc-1", front: "remote", updatedAt: "2026-07-15T08:00:00Z" };
      const localRecord = { id: "fc-1", front: "local", updatedAt: "2026-07-15T10:00:00Z" };

      dexieMock.flashcards.get.mockResolvedValue(localRecord);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ records: [remoteRecord], version: "v2" }),
      });

      await service.trigger();

      expect(dexieMock.flashcards.put).not.toHaveBeenCalled();
    });

    it("should keep local when remote has no updatedAt", async () => {
      const service = createSyncService(() => "user-1");

      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);

      const remoteRecord = { id: "fc-1", front: "remote no date" };
      const localRecord = { id: "fc-1", front: "local", updatedAt: "2026-07-15T10:00:00Z" };

      dexieMock.flashcards.get.mockResolvedValue(localRecord);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ records: [remoteRecord], version: "v2" }),
      });

      await service.trigger();

      expect(dexieMock.flashcards.put).not.toHaveBeenCalled();
    });

    it("should pull remote when local has no updatedAt", async () => {
      const service = createSyncService(() => "user-1");

      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);

      const remoteRecord = { id: "fc-1", front: "remote", updatedAt: "2026-07-15T10:00:00Z" };

      dexieMock.flashcards.get.mockResolvedValue({ id: "fc-1", front: "local" });
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ records: [remoteRecord], version: "v2" }),
      });

      await service.trigger();

      expect(dexieMock.flashcards.put).toHaveBeenCalledWith(remoteRecord);
    });

    it("should save checkpoint after pulling", async () => {
      const service = createSyncService(() => "user-1");

      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ records: [{ id: "fc-1", front: "test" }], version: "v3" }),
      });
      dexieMock.flashcards.get.mockResolvedValue(undefined);

      await service.trigger();

      expect(dexieMock.syncCheckpoints.put).toHaveBeenCalledWith(
        expect.objectContaining({ table: "flashcards", lastPulledVersion: "v3" }),
      );
    });
  });

  describe("start() / stop()", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it("should start the sync interval and trigger immediately", async () => {
      const service = createSyncService(() => "user-1");

      mockGetPending.mockResolvedValue([]);
      dexieMock.syncCheckpoints.toArray.mockResolvedValue([]);
      mockFetch.mockResolvedValue({ ok: true, json: async () => ({ records: [], version: "v1" }) });

      service.start();

      expect(mockInitWriters).toHaveBeenCalled();
      await vi.advanceTimersToNextTimerAsync();
    });

    it("should stop the sync interval", () => {
      const service = createSyncService(() => "user-1");
      service.start();
      service.stop();

      expect(service.status().state).toBe("idle");
    });

    it("should be idempotent on double start", () => {
      const service = createSyncService(() => "user-1");
      service.start();
      service.start();
      service.stop();
    });
  });

  describe("onStatusChange", () => {
    it("should register listeners and return unsubscribe function", () => {
      const service = createSyncService(() => "user-1");
      const listener = vi.fn();
      const unsub = service.onStatusChange(listener);

      expect(typeof unsub).toBe("function");

      unsub();
    });
  });
});
