import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";

vi.mock("@/lib/db/client", () => ({
  COLLECTIONS: { SYNC_ENTRIES: "sync_entries" },
  APPWRITE_DATABASE_ID: "test-db",
  listDocuments: vi.fn(),
}));

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(async () => "test-user"),
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

const { listDocuments } = await import("@/lib/db/client");
const { GET } = await import("../pull/route");

function makeGet(url: string): NextRequest {
  return new NextRequest(new Request(url, { method: "GET" }));
}

describe("GET /api/sync/pull", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns parsed records for a table", async () => {
    (listDocuments as Mock).mockResolvedValue([
      { $id: "1", data: JSON.stringify({ id: "fc_1", front: "hello" }) },
      { $id: "2", data: JSON.stringify({ id: "fc_2", front: "world" }) },
    ]);

    const res = await GET(makeGet("http://localhost/api/sync/pull?table=flashcards&since=0"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records).toHaveLength(2);
    expect(body.records[0].front).toBe("hello");
    expect(body.version).toBeTruthy();
  });

  it("returns empty records when no matching docs", async () => {
    (listDocuments as Mock).mockResolvedValue([]);

    const res = await GET(makeGet("http://localhost/api/sync/pull?table=flashcards&since=0"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records).toHaveLength(0);
  });

  it("returns empty when table param is missing", async () => {
    const res = await GET(makeGet("http://localhost/api/sync/pull?since=0"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records).toHaveLength(0);
    expect(body.version).toBe("");
  });

  it("filters out records that fail JSON parse", async () => {
    (listDocuments as Mock).mockResolvedValue([
      { $id: "1", data: JSON.stringify({ id: "fc_1" }) },
      { $id: "2", data: "not-valid-json" },
    ]);

    const res = await GET(makeGet("http://localhost/api/sync/pull?table=flashcards&since=0"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.records).toHaveLength(1);
    expect(body.records[0].id).toBe("fc_1");
  });

  it("passes table and since params to listDocuments", async () => {
    (listDocuments as Mock).mockResolvedValue([]);

    const since = 1700000000000;
    await GET(makeGet(`http://localhost/api/sync/pull?table=flashcards&since=${since}`));

    expect(listDocuments).toHaveBeenCalledOnce();
    expect((listDocuments as Mock).mock.calls[0][0]).toBe("sync_entries");
    const filters = (listDocuments as Mock).mock.calls[0][1];
    expect(filters).toBeDefined();
    expect(Array.isArray(filters)).toBe(true);
    expect(filters.length).toBeGreaterThanOrEqual(1);
  });
});
