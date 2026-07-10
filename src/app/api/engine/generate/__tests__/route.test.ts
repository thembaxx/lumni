import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGenerate = vi.hoisted(() =>
  vi.fn().mockResolvedValue({
    questions: [{ id: "q1", type: "multiple-choice" as const, text: "Test?" }],
    sources: [],
    jobIds: [],
  }),
);

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => "test-user-id"),
}));

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: vi.fn(async () => ({ allowed: true, userId: "test-user-id" })),
  trackUsage: vi.fn(),
}));

vi.mock("@/lib/orchestrator/learning-orchestrator", () => ({
  LearningOrchestrator: {
    initialize: vi.fn().mockResolvedValue({
      generateQuestionSet: mockGenerate,
    }),
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

import { POST } from "../route";

function createPost(body: Record<string, unknown>) {
  return new Request("http://localhost:3000/api/engine/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/engine/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with valid minimal request", async () => {
    const res = await POST(createPost({ subject: "mathematics", count: 5 }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty("questions");
    expect(data).toHaveProperty("sources");
    expect(Array.isArray(data.questions)).toBe(true);
  });

  it("returns validation error when subject is missing", async () => {
    const res = await POST(createPost({ count: 5 }));
    expect(res.status).toBe(400);
  });

  it("returns validation error when count is missing", async () => {
    const res = await POST(createPost({ subject: "mathematics" }));
    expect(res.status).toBe(400);
  });

  it("returns validation error when count > 50", async () => {
    const res = await POST(createPost({ subject: "mathematics", count: 100 }));
    expect(res.status).toBe(400);
  });

  it("returns validation error when count is 0", async () => {
    const res = await POST(createPost({ subject: "mathematics", count: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 429 when budget exceeded", async () => {
    const budget = await import("@/lib/ai/with-budget");
    vi.mocked(budget.checkBudget).mockResolvedValueOnce({
      allowed: false,
      userId: "test-user-id",
      response: new Response(JSON.stringify({ error: "Budget exceeded" }), { status: 429 }),
    });
    const res = await POST(createPost({ subject: "mathematics", count: 5 }));
    expect(res.status).toBe(429);
  });
});
