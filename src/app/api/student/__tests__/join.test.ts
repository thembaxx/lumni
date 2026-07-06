import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetAuthenticatedUserId = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

vi.mock("@/lib/shared/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 100, resetAt: Date.now() + 60000 })),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock("appwrite", () => ({
  Query: {
    equal: vi.fn((f: string, v: unknown) => `${f}=${v}`),
    limit: vi.fn((n: number) => `limit(${n})`),
  },
}));

const mockListDocuments = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();
vi.mock("@/lib/db/client", () => ({
  COLLECTIONS: { CLASSROOM_CODES: "classroom_codes", TEACHER_STUDENTS: "teacher_students" },
  listDocuments: mockListDocuments,
  createDocument: mockCreateDocument,
  updateDocument: mockUpdateDocument,
}));

const { POST } = await import("../join/route");

function makePost(code: string): NextRequest {
  return new NextRequest("http://localhost/api/student/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ code }),
  });
}

function makeValidDoc(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $id: "code-doc-1",
    code: "ABC123",
    teacherId: "teacher-456",
    revoked: false,
    expiresAt: Date.now() + 86400000,
    useCount: 0,
    maxUses: null,
    subjectId: null,
    ...overrides,
  };
}

describe("POST /api/student/join", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUserId.mockResolvedValue("student-789");
  });

  test("rejects invalid code format", async () => {
    const req = makePost("ABC12");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("Invalid join code format");
    expect(mockListDocuments).not.toHaveBeenCalled();
  });

  test("rejects revoked code", async () => {
    mockListDocuments.mockResolvedValue([makeValidDoc({ revoked: true })]);

    const req = makePost("ABC123");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("revoked");
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  test("rejects expired code", async () => {
    mockListDocuments.mockResolvedValue([makeValidDoc({ expiresAt: Date.now() - 1000 })]);

    const req = makePost("ABC123");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("expired");
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  test("rejects max-uses exceeded", async () => {
    mockListDocuments.mockResolvedValue([makeValidDoc({ maxUses: 5, useCount: 5 })]);

    const req = makePost("ABC123");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("maximum");
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  test("prevents teacher from joining own classroom", async () => {
    mockListDocuments.mockResolvedValue([makeValidDoc({ teacherId: "student-789" })]);

    const req = makePost("ABC123");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("Cannot join your own");
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });

  test("prevents duplicate link", async () => {
    mockListDocuments
      .mockResolvedValueOnce([makeValidDoc()])
      .mockResolvedValueOnce([
        { $id: "existing-link", teacherId: "teacher-456", studentId: "student-789" },
      ]);

    const req = makePost("ABC123");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("Already linked");
    expect(mockCreateDocument).not.toHaveBeenCalled();
  });
});
