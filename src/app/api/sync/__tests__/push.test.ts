import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDocs: Array<Record<string, unknown>> = [];

vi.mock("@/lib/db/client", () => ({
  COLLECTIONS: { SYNC_ENTRIES: "sync_entries" },
  APPWRITE_DATABASE_ID: "test-db",
  listDocuments: vi.fn(async () => mockDocs),
  createDocument: vi.fn(async () => "doc-new"),
  updateDocument: vi.fn(async () => undefined),
  deleteDocument: vi.fn(async () => undefined),
}));

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(async () => "test-user"),
  requireAdmin: vi.fn(async () => undefined),
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

const { POST } = await import("../push/route");

function makePost(url: string, body?: unknown): NextRequest {
  return new NextRequest(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

describe("POST /api/sync/push", () => {
  beforeEach(() => {
    mockDocs.length = 0;
    vi.clearAllMocks();
  });

  it("returns accepted for create operation", async () => {
    const res = await POST(
      makePost("http://localhost/api/sync/push", {
        table: "flashcards",
        recordId: "fc_1",
        operation: "create",
        data: JSON.stringify({ front: "hello", back: "world" }),
        createdAt: Date.now(),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
  });

  it("returns accepted for update operation", async () => {
    mockDocs.push({ $id: "existing-doc", table: "flashcards", recordId: "fc_1" });

    const res = await POST(
      makePost("http://localhost/api/sync/push", {
        table: "flashcards",
        recordId: "fc_1",
        operation: "update",
        data: JSON.stringify({ front: "updated", back: "world" }),
        createdAt: Date.now(),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
  });

  it("returns accepted for delete operation", async () => {
    mockDocs.push({ $id: "existing-doc", table: "flashcards", recordId: "fc_1" });

    const res = await POST(
      makePost("http://localhost/api/sync/push", {
        table: "flashcards",
        recordId: "fc_1",
        operation: "delete",
        data: JSON.stringify({ id: "fc_1" }),
        createdAt: Date.now(),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
  });

  it("handles delete when no existing doc found", async () => {
    const res = await POST(
      makePost("http://localhost/api/sync/push", {
        table: "flashcards",
        recordId: "nonexistent",
        operation: "delete",
        data: JSON.stringify({ id: "nonexistent" }),
        createdAt: Date.now(),
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
  });

  it("returns 400 when table is missing", async () => {
    const res = await POST(
      makePost("http://localhost/api/sync/push", {
        recordId: "fc_1",
        operation: "create",
        data: "{}",
        createdAt: Date.now(),
      }),
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when recordId is missing", async () => {
    const res = await POST(
      makePost("http://localhost/api/sync/push", {
        table: "flashcards",
        operation: "create",
        data: "{}",
        createdAt: Date.now(),
      }),
    );
    expect(res.status).toBe(400);
  });
});
