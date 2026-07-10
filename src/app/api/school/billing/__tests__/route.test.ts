import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../route";

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/school/billing-service", () => ({
  getBillingInfo: vi.fn().mockResolvedValue({
    school: {
      id: "school-1",
      name: "Test School",
      licenseTier: "standard",
      billingStatus: "active",
      seatCount: 50,
      seatsUsed: 30,
      trialEndsAt: null,
    },
    currentLicense: { tier: "standard", seats: 50 },
    invoices: [],
    totalPages: 1,
  }),
}));

describe("GET /api/school/billing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns billing info with valid schoolId", async () => {
    const req = new Request("http://localhost/api/school/billing?schoolId=school-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.school.name).toBe("Test School");
    expect(data.school.licenseTier).toBe("standard");
  });

  it("returns 400 when schoolId is missing", async () => {
    const req = new Request("http://localhost/api/school/billing");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns 401 when unauthenticated", async () => {
    const auth = await import("@/lib/server/auth");
    vi.mocked(auth.getAuthenticatedUserId).mockResolvedValueOnce(null);
    const req = new Request("http://localhost/api/school/billing?schoolId=school-1");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});
