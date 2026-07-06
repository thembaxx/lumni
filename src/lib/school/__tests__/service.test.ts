import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/appwrite.server", () => ({
  databases: {
    listDocuments: vi.fn(),
    getDocument: vi.fn(),
    createDocument: vi.fn(),
    updateDocument: vi.fn(),
  },
}));

import { databases } from "@/lib/appwrite.server";
import {
  createSchool,
  getSchool,
  listSchools,
  getSchoolMembers,
  addSchoolMember,
  isUserSchoolMember,
  lookupSchoolByCode,
  checkDomain,
} from "@/lib/school/service";
import type { Models } from "node-appwrite";

const mockDoc = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  $id: "school-1",
  $createdAt: "2026-01-01T00:00:00.000Z",
  $updatedAt: "2026-01-01T00:00:00.000Z",
  name: "Test School",
  slug: "test-school",
  domain: null,
  contactEmail: "admin@test.com",
  contactPhone: null,
  address: null,
  licenseTier: "free",
  seatCount: 1,
  seatsUsed: 1,
  billingStatus: "active",
  trialEndsAt: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
});

describe("createSchool", () => {
  it("creates school with admin + teacher membership and join code", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 0,
      documents: [],
    } as unknown as Models.DocumentList<Record<string, unknown>>);
    vi.mocked(databases.createDocument).mockResolvedValue({
      $id: "doc-1",
    } as unknown as Models.Document);

    const result = await createSchool(
      { name: "Test School", contactEmail: "admin@test.com" },
      "user-1",
    );

    expect(result.school.name).toBe("Test School");
    expect(result.joinCode).toMatch(/^[A-Z0-9]{6}$/);
    expect(databases.createDocument).toHaveBeenCalledTimes(4);
  });

  it("rejects duplicate domain", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [mockDoc({ domain: "taken.com" })],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    await expect(
      createSchool({ name: "Test", domain: "taken.com", contactEmail: "a@b.com" }, "user-1"),
    ).rejects.toMatchObject({ code: "DOMAIN_TAKEN" });
  });
});

describe("getSchool", () => {
  it("returns school when found", async () => {
    vi.mocked(databases.getDocument).mockResolvedValue(mockDoc() as unknown as Models.Document);

    const school = await getSchool("school-1");
    expect(school).not.toBeNull();
    expect(school!.name).toBe("Test School");
  });

  it("returns null on error (not found)", async () => {
    vi.mocked(databases.getDocument).mockRejectedValue(new Error("Not found"));

    const school = await getSchool("nonexistent");
    expect(school).toBeNull();
  });
});

describe("listSchools", () => {
  it("returns paginated schools", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 2,
      documents: [mockDoc(), mockDoc({ $id: "school-2", name: "School 2" })],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await listSchools(1, 10);
    expect(result.schools).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it("filters by billing status", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [mockDoc({ billingStatus: "active" })],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await listSchools(1, 10, "active");
    expect(result.schools).toHaveLength(1);
    expect(databases.listDocuments).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.arrayContaining([expect.objectContaining({})]),
    );
  });

  it("returns empty on error", async () => {
    vi.mocked(databases.listDocuments).mockRejectedValue(new Error("DB error"));

    const result = await listSchools();
    expect(result.schools).toEqual([]);
    expect(result.total).toBe(0);
  });
});

describe("getSchoolMembers", () => {
  it("groups members by role", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 4,
      documents: [
        {
          $id: "m1",
          schoolId: "s1",
          userId: "u1",
          role: "admin",
          status: "active",
          joinedAt: "2026-01-01",
        },
        {
          $id: "m2",
          schoolId: "s1",
          userId: "u2",
          role: "teacher",
          status: "active",
          joinedAt: "2026-01-01",
        },
        {
          $id: "m3",
          schoolId: "s1",
          userId: "u3",
          role: "student",
          status: "active",
          joinedAt: "2026-01-01",
        },
        {
          $id: "m4",
          schoolId: "s1",
          userId: "u4",
          role: "student",
          status: "active",
          joinedAt: "2026-01-01",
        },
      ],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await getSchoolMembers("s1");
    expect(result.admins).toHaveLength(1);
    expect(result.teachers).toHaveLength(1);
    expect(result.students).toHaveLength(2);
  });

  it("returns empty groups on error", async () => {
    vi.mocked(databases.listDocuments).mockRejectedValue(new Error("DB error"));

    const result = await getSchoolMembers("s1");
    expect(result.admins).toEqual([]);
    expect(result.teachers).toEqual([]);
    expect(result.students).toEqual([]);
  });
});

describe("addSchoolMember", () => {
  it("adds teacher and increments seatsUsed", async () => {
    vi.mocked(databases.createDocument).mockResolvedValue({
      $id: "m1",
      schoolId: "s1",
      userId: "u2",
      role: "teacher",
      status: "active",
      joinedAt: "2026-01-01",
      createdAt: "2026-01-01",
    } as unknown as Models.Document);
    vi.mocked(databases.getDocument).mockResolvedValue(
      mockDoc({ seatsUsed: 1 }) as unknown as Models.Document,
    );
    vi.mocked(databases.updateDocument).mockResolvedValue({} as unknown as Models.Document);

    const result = await addSchoolMember("s1", "u2", "teacher");
    expect(result).not.toBeNull();
    expect(result!.role).toBe("teacher");
    expect(databases.updateDocument).toHaveBeenCalled();
  });

  it("adds student without incrementing seatsUsed", async () => {
    vi.mocked(databases.createDocument).mockResolvedValue({
      $id: "m2",
      schoolId: "s1",
      userId: "u3",
      role: "student",
      status: "active",
      joinedAt: "2026-01-01",
      createdAt: "2026-01-01",
    } as unknown as Models.Document);

    const result = await addSchoolMember("s1", "u3", "student");
    expect(result).not.toBeNull();
    expect(result!.role).toBe("student");
    expect(databases.getDocument).not.toHaveBeenCalled();
    expect(databases.updateDocument).not.toHaveBeenCalled();
  });
});

describe("isUserSchoolMember", () => {
  it("returns isMember true with role when found", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [
        {
          $id: "m1",
          schoolId: "s1",
          userId: "u1",
          role: "teacher",
          status: "active",
          joinedAt: "2026-01-01",
        },
      ],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await isUserSchoolMember("s1", "u1");
    expect(result.isMember).toBe(true);
    expect(result.role).toBe("teacher");
  });

  it("returns isMember false when not found", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 0,
      documents: [],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await isUserSchoolMember("s1", "unknown");
    expect(result.isMember).toBe(false);
  });

  it("returns isMember false on error", async () => {
    vi.mocked(databases.listDocuments).mockRejectedValue(new Error("DB error"));

    const result = await isUserSchoolMember("s1", "u1");
    expect(result.isMember).toBe(false);
  });
});

describe("lookupSchoolByCode", () => {
  it("returns school and type for valid code", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [
        {
          $id: "c1",
          code: "ABC123",
          schoolId: "school-1",
          type: "teacher",
          maxUses: null,
          useCount: 0,
          expiresAt: null,
        },
      ],
    } as unknown as Models.DocumentList<Record<string, unknown>>);
    vi.mocked(databases.getDocument).mockResolvedValue(mockDoc() as unknown as Models.Document);

    const result = await lookupSchoolByCode("ABC123");
    expect(result.school).not.toBeNull();
    expect(result.type).toBe("teacher");
  });

  it("returns null for expired code", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [
        {
          $id: "c1",
          code: "EXPIRED",
          schoolId: "school-1",
          type: "teacher",
          maxUses: null,
          useCount: 0,
          expiresAt: "2020-01-01T00:00:00.000Z",
        },
      ],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await lookupSchoolByCode("EXPIRED");
    expect(result.school).toBeNull();
    expect(result.type).toBeNull();
  });

  it("returns null for exhausted code", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [
        {
          $id: "c1",
          code: "EXHAUST",
          schoolId: "school-1",
          type: "teacher",
          maxUses: 5,
          useCount: 5,
          expiresAt: null,
        },
      ],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await lookupSchoolByCode("EXHAUST");
    expect(result.school).toBeNull();
    expect(result.type).toBeNull();
  });

  it("returns null when code not found", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 0,
      documents: [],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await lookupSchoolByCode("NONEXIST");
    expect(result.school).toBeNull();
    expect(result.type).toBeNull();
  });
});

describe("checkDomain", () => {
  it("returns registered: true for existing domain", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 1,
      documents: [mockDoc({ domain: "test.com", name: "Test School" })],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await checkDomain("test.com");
    expect(result.registered).toBe(true);
    expect(result.schoolName).toBe("Test School");
  });

  it("returns registered: false for free domain", async () => {
    vi.mocked(databases.listDocuments).mockResolvedValue({
      total: 0,
      documents: [],
    } as unknown as Models.DocumentList<Record<string, unknown>>);

    const result = await checkDomain("new.com");
    expect(result.registered).toBe(false);
  });
});
