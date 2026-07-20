import { describe, it, expect } from "vitest";

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
