import { describe, it, expect, vi, beforeEach } from "vitest";

describe("isSyncableTable", () => {
  it("should return true for syncable tables", async () => {
    const { isSyncableTable } = await import("../sync-writer");
    expect(isSyncableTable("flashcards")).toBe(true);
    expect(isSyncableTable("notes")).toBe(true);
    expect(isSyncableTable("competencies")).toBe(true);
    expect(isSyncableTable("bookmarks")).toBe(true);
    expect(isSyncableTable("studyPlans")).toBe(true);
  });

  it("should return false for non-syncable tables", async () => {
    const { isSyncableTable } = await import("../sync-writer");
    expect(isSyncableTable("syncOutbox")).toBe(false);
    expect(isSyncableTable("userSettings")).toBe(false);
    expect(isSyncableTable("unknown")).toBe(false);
  });
});

describe("wrapTableForSync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not crash when wrapping a table", async () => {
    const { wrapTableForSync } = await import("../sync-writer");

    const table = {
      put: vi.fn().mockResolvedValue("id-1"),
      add: vi.fn().mockResolvedValue("id-2"),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    expect(() => wrapTableForSync("notes", table)).not.toThrow();
  });

  it("should still return correct result from put", async () => {
    const { wrapTableForSync } = await import("../sync-writer");

    const table = {
      put: vi.fn().mockResolvedValue("id-1"),
      add: vi.fn().mockResolvedValue("id-2"),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    wrapTableForSync("notes", table);

    // oxlint-disable-next-line typescript/no-explicit-any
    const result = await (table as any).put({ id: "n1", title: "test" });
    expect(result).toBe("id-1");
  });

  it("should still return correct result from add", async () => {
    const { wrapTableForSync } = await import("../sync-writer");

    const table = {
      put: vi.fn().mockResolvedValue("id-1"),
      add: vi.fn().mockResolvedValue("auto-id"),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    wrapTableForSync("notes", table);

    // oxlint-disable-next-line typescript/no-explicit-any
    const result = await (table as any).add({ title: "test" });
    expect(result).toBe("auto-id");
  });

  it("should still work with delete", async () => {
    const { wrapTableForSync } = await import("../sync-writer");

    const table = {
      put: vi.fn().mockResolvedValue("id-1"),
      add: vi.fn().mockResolvedValue("id-2"),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    wrapTableForSync("notes", table);

    // oxlint-disable-next-line typescript/no-explicit-any
    await expect((table as any).delete("some-id")).resolves.toBeUndefined();
  });

  it("should handle delete with numeric id", async () => {
    const { wrapTableForSync } = await import("../sync-writer");

    const table = {
      put: vi.fn().mockResolvedValue(1),
      add: vi.fn().mockResolvedValue(2),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    wrapTableForSync("quizAttempts", table);

    // oxlint-disable-next-line typescript/no-explicit-any
    await expect((table as any).delete(42)).resolves.toBeUndefined();
  });
});
