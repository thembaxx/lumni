import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/db/dexie-data-access", () => ({
  dexieDataAccess: {
    syncOutbox: {
      add: vi.fn(),
      orderBy: vi.fn(() => ({ limit: vi.fn(() => ({ toArray: vi.fn() })) })),
      get: vi.fn(),
      update: vi.fn(),
      bulkDelete: vi.fn(),
      count: vi.fn(),
      toArray: vi.fn(),
    },
    syncCheckpoints: { toArray: vi.fn(), put: vi.fn() },
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
  },
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

import { enqueueOutbox } from "../outbox";
import { createSyncService } from "../service";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";

describe("Sync Smoke Test", () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("enqueueOutbox creates pending entries", async () => {
    (dexieDataAccess.syncOutbox.add as Mock).mockResolvedValue(1);

    await enqueueOutbox("flashcards", "fc_1", "create", { front: "hello", back: "world" });

    expect(dexieDataAccess.syncOutbox.add).toHaveBeenCalledWith(
      expect.objectContaining({
        table: "flashcards",
        recordId: "fc_1",
        operation: "create",
        data: expect.stringContaining("hello"),
      }),
    );
  });

  it("pushOutbox sends entries and removes on success", async () => {
    const mockToArray = vi.fn().mockResolvedValue([
      {
        id: 1,
        table: "flashcards",
        recordId: "fc_1",
        operation: "create",
        data: "{}",
        createdAt: Date.now(),
        retries: 0,
      },
    ]);
    (dexieDataAccess.syncOutbox.orderBy as Mock).mockReturnValue({
      limit: vi.fn(() => ({ toArray: mockToArray })),
    });
    (dexieDataAccess.syncOutbox.bulkDelete as Mock).mockResolvedValue(undefined);
    mockFetch.mockResolvedValueOnce({ ok: true });

    const service = createSyncService(() => "test-user");
    const result = await service.trigger();

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/sync/push",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    );
    expect(result.pushed).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it("pushOutbox handles network errors gracefully", async () => {
    const mockToArray = vi.fn().mockResolvedValue([
      {
        id: 1,
        table: "flashcards",
        recordId: "fc_1",
        operation: "create",
        data: "{}",
        createdAt: Date.now(),
        retries: 0,
      },
    ]);
    (dexieDataAccess.syncOutbox.orderBy as Mock).mockReturnValue({
      limit: vi.fn(() => ({ toArray: mockToArray })),
    });
    (dexieDataAccess.syncOutbox.get as Mock).mockResolvedValue({ retries: 0 });
    (dexieDataAccess.syncOutbox.update as Mock).mockResolvedValue(undefined);
    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    const service = createSyncService(() => "test-user");
    const result = await service.trigger();

    expect(result.pushed).toBe(0);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("pullRemote fetches and stores remote records", async () => {
    (dexieDataAccess.syncCheckpoints.toArray as Mock).mockResolvedValue([]);
    const record = { id: "fc_1", front: "synced hello" };
    // 4 tables queried + 1 push call = 5 total fetch calls
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ records: [record], version: "v1" }),
    });

    const service = createSyncService(() => "test-user");
    await service.trigger();

    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining("/api/sync/pull"));
    expect(dexieDataAccess.flashcards.put).toHaveBeenCalledWith(record);
  });
});
