import { beforeEach, describe, expect, test, vi } from "vitest";

const store: Array<{
  id: number;
  table: string;
  recordId: string;
  operation: string;
  data: string;
  createdAt: number;
  retries: number;
}> = [];

let nextId = 1;

const mockTable = {
  add: vi.fn(async (item: Record<string, unknown>) => {
    const id = nextId++;
    // oxlint-disable-next-line typescript/no-explicit-any
    store.push({ id, ...item } as any);
    return id;
  }),
  get: vi.fn(async (id: number) => store.find((e) => e.id === id)),
  update: vi.fn(async (id: number, changes: Record<string, unknown>) => {
    const idx = store.findIndex((e) => e.id === id);
    if (idx >= 0) Object.assign(store[idx], changes);
    return 1;
  }),
  bulkDelete: vi.fn(async (ids: number[]) => {
    for (const id of ids) {
      const idx = store.findIndex((e) => e.id === id);
      if (idx >= 0) store.splice(idx, 1);
    }
  }),
  orderBy: vi.fn(() => ({
    limit: vi.fn((n: number) => ({
      toArray: vi.fn(async () =>
        [...store].toSorted((a, b) => a.createdAt - b.createdAt).slice(0, n),
      ),
    })),
  })),
  count: vi.fn(async () => store.length),
};

vi.mock("@/lib/db/schema", () => ({
  offlineDB: {
    table: vi.fn(() => mockTable),
  },
}));

const { enqueueOutbox, getPendingOutboxEntries, removeOutboxEntries, getOutboxCount } =
  await import("../outbox");

describe("outbox queue", () => {
  beforeEach(() => {
    store.length = 0;
    nextId = 1;
    vi.clearAllMocks();
  });

  test("enqueue adds an entry", async () => {
    await enqueueOutbox("flashcards", "card-1", "update", { front: "hello" });
    const count = await getOutboxCount();
    expect(count).toBe(1);
  });

  test("getPendingOutboxEntries returns entries ordered by createdAt", async () => {
    await enqueueOutbox("notes", "note-1", "create", { title: "first" });
    await new Promise((r) => setTimeout(r, 10));
    await enqueueOutbox("notes", "note-2", "create", { title: "second" });

    const entries = await getPendingOutboxEntries(10);
    expect(entries.length).toBe(2);
    expect(entries[0].recordId).toBe("note-1");
  });

  test("removeOutboxEntries removes specified entries", async () => {
    await enqueueOutbox("a", "1", "create", {});
    await enqueueOutbox("a", "2", "create", {});
    const entries = await getPendingOutboxEntries(10);
    const ids = entries.map((e) => e.id!);

    await removeOutboxEntries([ids[0]]);
    const remaining = await getPendingOutboxEntries(10);
    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe(ids[1]);
  });

  test("enqueue stores serialised data", async () => {
    const data = { score: 85, topic: "algebra" };
    await enqueueOutbox("competencies", "comp-1", "update", data);

    const entries = await getPendingOutboxEntries(10);
    const parsed = JSON.parse(entries[0].data);
    expect(parsed.score).toBe(85);
    expect(parsed.topic).toBe("algebra");
  });

  test("getOutboxCount returns 0 when empty", async () => {
    const count = await getOutboxCount();
    expect(count).toBe(0);
  });
});
