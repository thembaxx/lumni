import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../route";

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/school/billing-service", () => ({
  createStripeCheckoutSession: vi.fn().mockResolvedValue({
    checkoutUrl: "https://checkout.stripe.com/test",
    sessionId: "cs_test_123",
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
  return new Request("http://localhost/api/school/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/school/checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates checkout session with valid body", async () => {
    const res = await POST(
      createPost({
        schoolId: "school-1",
        tier: "standard",
        billingFrequency: "monthly",
        seatCount: 10,
        returnUrl: "https://app.example.com/billing",
      }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.checkoutUrl).toContain("stripe.com");
  });

  it("returns 400 with invalid body", async () => {
    const res = await POST(createPost({ schoolId: "school-1" }));
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const auth = await import("@/lib/server/auth");
    vi.mocked(auth.getAuthenticatedUserId).mockResolvedValueOnce(null);
    const res = await POST(
      createPost({
        schoolId: "school-1",
        tier: "standard",
        billingFrequency: "monthly",
        seatCount: 10,
        returnUrl: "https://app.example.com/billing",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when user is not billing admin", async () => {
    const school = await import("@/lib/school/service");
    vi.mocked(school.isUserSchoolMember).mockResolvedValueOnce({
      isMember: true,
      role: "viewer",
    });
    const res = await POST(
      createPost({
        schoolId: "school-1",
        tier: "standard",
        billingFrequency: "monthly",
        seatCount: 10,
        returnUrl: "https://app.example.com/billing",
      }),
    );
    expect(res.status).toBe(403);
  });
});
