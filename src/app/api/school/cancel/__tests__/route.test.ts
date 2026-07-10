import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/school/billing-service", () => ({
  cancelSubscription: vi.fn().mockResolvedValue({
    id: "sub_123",
    status: "canceled",
    effectiveDate: new Date().toISOString(),
  }),
}));

vi.mock("@/lib/school/service", () => ({
  isUserSchoolMember: vi.fn().mockResolvedValue({
    isMember: true,
    role: "admin",
  }),
}));

vi.mock("@/lib/shared/with-rate-limit", () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
}));

function createPost(body: Record<string, unknown>) {
  return new Request("http://localhost/api/school/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/school/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels subscription with valid schoolId", async () => {
    const res = await POST(createPost({ schoolId: "school-1" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("canceled");
  });

  it("returns 400 with missing schoolId", async () => {
    const res = await POST(createPost({}));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const auth = await import("@/lib/server/auth");
    vi.mocked(auth.getAuthenticatedUserId).mockResolvedValueOnce(null);
    const res = await POST(createPost({ schoolId: "school-1" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not admin", async () => {
    const school = await import("@/lib/school/service");
    vi.mocked(school.isUserSchoolMember).mockResolvedValueOnce({
      isMember: true,
      role: "billing",
    });
    const res = await POST(createPost({ schoolId: "school-1" }));
    expect(res.status).toBe(403);
  });
});
