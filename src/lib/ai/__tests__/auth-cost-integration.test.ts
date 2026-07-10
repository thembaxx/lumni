import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetAuthenticatedUserId = vi.hoisted(() => vi.fn());
const mockCheckBudget = vi.hoisted(() => vi.fn());
const mockTrackUsage = vi.hoisted(() => vi.fn());
const mockGenerateText = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
}));

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: mockCheckBudget,
  trackUsage: mockTrackUsage,
}));

vi.mock("@/lib/ai/client", () => ({
  generateText: mockGenerateText,
}));

import { createRouteHandler } from "@/lib/api/create-route-handler";

function makePost(body = {}) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("auth-to-AI-cost pipeline", () => {
  const testConfig = {
    auth: "required" as const,
    budget: "generate" as const,
    errorLabel: "TestRoute" as const,
    validate: (_body: unknown) => null as string | null,
    execute: vi.fn().mockResolvedValue({ ok: true }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("authenticated user passes budget check and tracks usage", async () => {
    mockGetAuthenticatedUserId.mockResolvedValue("user-123");
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "user-123" });

    const handler = createRouteHandler(testConfig);
    const res = await handler(makePost());
    expect(res.status).toBe(200);
    expect(mockCheckBudget).toHaveBeenCalled();
  });

  it("budget exceeded returns 429, execute NOT called", async () => {
    mockGetAuthenticatedUserId.mockResolvedValue("user-123");
    mockCheckBudget.mockResolvedValue({
      allowed: false,
      userId: "user-123",
      response: new Response(JSON.stringify({ error: "Budget exceeded" }), { status: 429 }),
    });

    const handler = createRouteHandler(testConfig);
    const res = await handler(makePost());
    expect(res.status).toBe(429);
    expect(testConfig.execute).not.toHaveBeenCalled();
  });

  it("budget check failure returns 500, execute NOT called", async () => {
    mockGetAuthenticatedUserId.mockResolvedValue("user-123");
    mockCheckBudget.mockRejectedValue(new Error("Budget service unavailable"));

    const handler = createRouteHandler(testConfig);
    const res = await handler(makePost());
    expect(res.status).toBe(500);
    expect(testConfig.execute).not.toHaveBeenCalled();
  });
});
