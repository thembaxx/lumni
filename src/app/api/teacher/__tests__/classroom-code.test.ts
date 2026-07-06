import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetAuthenticatedUserId = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

vi.mock("appwrite", () => ({
  Query: {
    equal: vi.fn((f: string, v: unknown) => `${f}=${v}`),
    limit: vi.fn((n: number) => `limit(${n})`),
  },
}));

const mockListDocuments = vi.fn();

vi.mock("@/lib/db/client", () => ({
  APPWRITE_DATABASE_ID: "test-db",
  COLLECTIONS: { CLASSROOM_CODES: "classroom_codes" },
  listDocuments: mockListDocuments,
}));

const mockCreateDocument = vi.fn();
const mockDbUpdateDocument = vi.fn();
vi.mock("@/lib/appwrite.server", () => ({
  databases: {
    createDocument: mockCreateDocument,
    updateDocument: mockDbUpdateDocument,
  },
}));

const { POST, GET, DELETE } = await import("../classroom/code/route");

describe("POST /api/teacher/classroom/code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUserId.mockResolvedValue("teacher-123");
  });

  test("generates a 6-character alphanumeric code", async () => {
    mockListDocuments.mockResolvedValue([]);
    mockCreateDocument.mockResolvedValue({ $id: "code-123" });

    const req = new NextRequest("http://localhost/api/teacher/classroom/code", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.code).toBeDefined();
    expect(body.code).toHaveLength(6);
    expect(body.url).toBe(`/join/${body.code}`);
    expect(mockCreateDocument).toHaveBeenCalledTimes(1);
  });
});

describe("GET /api/teacher/classroom/code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUserId.mockResolvedValue("teacher-123");
  });

  test("lists active (non-expired) codes", async () => {
    const now = Date.now();
    mockListDocuments.mockResolvedValue([
      {
        $id: "1",
        code: "ABC123",
        teacherId: "teacher-123",
        revoked: false,
        expiresAt: now + 86400000,
        useCount: 0,
        maxUses: null,
        createdAt: now,
        label: "Test",
        subjectId: null,
      },
      {
        $id: "2",
        code: "DEF456",
        teacherId: "teacher-123",
        revoked: false,
        expiresAt: now + 172800000,
        useCount: 1,
        maxUses: null,
        createdAt: now,
        label: null,
        subjectId: "math",
      },
    ]);

    const req = new NextRequest("http://localhost/api/teacher/classroom/code");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.codes).toHaveLength(2);
    expect(body.codes[0].code).toBe("ABC123");
    expect(body.codes[1].code).toBe("DEF456");
  });

  test("excludes expired codes", async () => {
    mockListDocuments.mockResolvedValue([
      {
        $id: "1",
        code: "EXPIRED",
        teacherId: "teacher-123",
        revoked: false,
        expiresAt: Date.now() - 1000,
        useCount: 0,
        maxUses: null,
        createdAt: Date.now() - 86400000,
        label: null,
        subjectId: null,
      },
    ]);

    const req = new NextRequest("http://localhost/api/teacher/classroom/code");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.codes).toHaveLength(0);
  });
});

describe("DELETE /api/teacher/classroom/code", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUserId.mockResolvedValue("teacher-123");
  });

  test("revokes a code", async () => {
    mockListDocuments.mockResolvedValue([
      { $id: "doc-1", code: "ABC123", teacherId: "teacher-123" },
    ]);
    mockDbUpdateDocument.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost/api/teacher/classroom/code", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "ABC123" }),
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.revoked).toBe(true);
    expect(mockDbUpdateDocument).toHaveBeenCalledWith(
      "test-db",
      "classroom_codes",
      "doc-1",
      { revoked: true },
    );
  });

  test("returns error when code not found", async () => {
    mockListDocuments.mockResolvedValue([]);

    const req = new NextRequest("http://localhost/api/teacher/classroom/code", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code: "NONEXIST" }),
    });
    const res = await DELETE(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(false);
    expect(body.error).toContain("not found");
    expect(mockDbUpdateDocument).not.toHaveBeenCalled();
  });
});
