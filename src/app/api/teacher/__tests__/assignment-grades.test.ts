import { NextRequest } from "next/server";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetAuthenticatedUserId = vi.fn<() => Promise<string | null>>();
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
  isTeacher: vi.fn((userId: string) => userId === "teacher-123"),
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

const mockUsersGet = vi.fn();
vi.mock("node-appwrite", () => ({
  Users: class {
    get = mockUsersGet;
  },
  Query: { equal: vi.fn((f: string, v: unknown) => `${f}=${v}`) },
}));

vi.mock("@/lib/appwrite.server", () => ({ serverClient: {} }));

const mockGetDocument = vi.fn();
const mockListDocuments = vi.fn();
vi.mock("@/lib/db/client", () => ({
  COLLECTIONS: {
    TEACHER_ASSIGNMENTS: "teacher_assignments",
    ASSIGNMENT_SUBMISSIONS: "assignment_submissions",
  },
  getDocument: mockGetDocument,
  listDocuments: mockListDocuments,
}));

const { GET } = await import("../assignments/[id]/grades/route");

function makeGet(assignmentId: string): NextRequest {
  return new NextRequest(`http://localhost/api/teacher/assignments/${assignmentId}/grades`);
}

describe("GET /api/teacher/assignments/[id]/grades", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUserId.mockResolvedValue("teacher-123");
  });

  test("returns 404 for non-existent assignment", async () => {
    mockGetDocument.mockResolvedValue(null);

    const res = await GET(makeGet("nonexistent"), {
      params: { id: "nonexistent" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("not found");
    expect(mockListDocuments).not.toHaveBeenCalled();
  });

  test("blocks unauthorized teacher", async () => {
    mockGetDocument.mockResolvedValue({
      $id: "assign-1",
      teacherId: "other-teacher",
      topicIds: "[]",
      status: "active",
    });

    const res = await GET(makeGet("assign-1"), {
      params: { id: "assign-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.error).toContain("Not authorized");
    expect(mockListDocuments).not.toHaveBeenCalled();
  });

  test("returns stats with empty grades when no submissions", async () => {
    mockGetDocument.mockResolvedValue({
      $id: "assign-1",
      teacherId: "teacher-123",
      topicIds: '["algebra"]',
      status: "active",
      dueDate: "2026-07-15",
    });
    mockListDocuments.mockResolvedValue([]);

    const res = await GET(makeGet("assign-1"), {
      params: { id: "assign-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.grades).toHaveLength(0);
    expect(body.stats.submissionCount).toBe(0);
    expect(body.stats.averagePercentage).toBe(0);
    expect(body.stats.highestPercentage).toBe(0);
    expect(body.stats.lowestPercentage).toBe(0);
    expect(body.assignment.id).toBe("assign-1");
  });

  test("returns correct stats with submissions", async () => {
    mockGetDocument.mockResolvedValue({
      $id: "assign-1",
      teacherId: "teacher-123",
      topicIds: '["algebra"]',
      status: "active",
    });
    mockListDocuments.mockResolvedValue([
      { studentId: "s1", score: 8, maxScore: 10, completedAt: "2026-01-01" },
      { studentId: "s2", score: 5, maxScore: 10, completedAt: "2026-01-02" },
    ]);
    mockUsersGet.mockImplementation(async (id: string) => {
      const names: Record<string, string> = { s1: "Alice", s2: "Bob" };
      return { $id: id, name: names[id] || "Unknown" };
    });

    const res = await GET(makeGet("assign-1"), {
      params: { id: "assign-1" },
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.grades).toHaveLength(2);
    expect(body.grades[0].studentName).toBe("Alice");
    expect(body.grades[0].score).toBe(8);
    expect(body.grades[0].percentage).toBe(80);
    expect(body.grades[1].studentName).toBe("Bob");
    expect(body.grades[1].score).toBe(5);
    expect(body.grades[1].percentage).toBe(50);
    expect(body.stats.submissionCount).toBe(2);
    expect(body.stats.totalStudents).toBe(2);
    expect(body.stats.averagePercentage).toBe(65);
    expect(body.stats.highestPercentage).toBe(80);
    expect(body.stats.lowestPercentage).toBe(50);
  });
});
