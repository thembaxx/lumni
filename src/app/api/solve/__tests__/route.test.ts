import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerateWithSystem = vi.fn<(...args: unknown[]) => unknown>();
const mockInitAI = vi.fn<(...args: unknown[]) => unknown>();
const mockIsAIConfigured = vi.fn<(...args: unknown[]) => unknown>();
const mockCheckBudget = vi.fn<(...args: unknown[]) => unknown>();
const mockTrackUsage = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("@/lib/ai", () => ({
  generateWithSystem: mockGenerateWithSystem,
  initAI: mockInitAI,
  isAIConfigured: mockIsAIConfigured,
}));

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: mockCheckBudget,
  trackUsage: mockTrackUsage,
}));

vi.mock("@/lib/shared/with-rate-limit", () => ({
  withRateLimit: (handler: unknown) => handler,
}));

const { NextRequest, NextResponse } = await import("next/server");
const { POST } = await import("../route");

describe("POST /api/solve", () => {
  beforeEach(() => {
    mockGenerateWithSystem.mockReset();
    mockInitAI.mockReset();
    mockIsAIConfigured.mockReset();
    mockCheckBudget.mockReset();
    mockTrackUsage.mockReset();
  });

  test("missing question and image returns 400", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("Either question text or image is required");
  });

  test("AI not configured returns 500", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(false);
    mockGenerateWithSystem.mockResolvedValue({
      available: false,
      error: "AI not configured",
      provider: "test",
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({ question: "2 + 2" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("AI solver failed: AI not configured");
  });

  test("budget exceeded returns 429", async () => {
    mockCheckBudget.mockResolvedValue({
      allowed: false,
      userId: "test-user",
      response: NextResponse.json({ error: "Daily generation limit reached" }, { status: 429 }),
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({ question: "2 + 2" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBe("Daily generation limit reached");
  });

  test("valid solve request returns solution, steps, and provider", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockResolvedValue({
      content: JSON.stringify({
        solution: "4",
        steps: ["Add 2 + 2", "Result is 4"],
      }),
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({ question: "2 + 2" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.solution).toBe("4");
    expect(body.steps).toEqual(["Add 2 + 2", "Result is 4"]);
    expect(body.provider).toBe("gemini");
    expect(mockTrackUsage).toHaveBeenCalledWith("generate", "test-user");
  });

  test("follow-up mode returns answer with no steps", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockResolvedValue({
      content: "You need to distribute the x first.",
      provider: "groq",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({
        question: "Why do I distribute?",
        followUp: true,
        context: [{ role: "user", content: "Solve x(2+3)" }],
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.answer).toBe("You need to distribute the x first.");
    expect(body.provider).toBe("groq");
  });

  test("extract mode returns extracted text", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockResolvedValue({
      content: JSON.stringify({
        solution: "Solve for x: 2x + 3 = 7",
        steps: [],
      }),
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({
        question: "",
        imageUrl: "http://example.com/math.png",
        mode: "extract",
      }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.solution).toBe("Solve for x: 2x + 3 = 7");
    expect(body.steps).toEqual([]);
  });

  test("JSON parse failure falls back to raw content with empty steps", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockResolvedValue({
      content: "The answer is 4\n\nExplanation: Add them together",
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({ question: "2 + 2" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.solution).toBe("The answer is 4\n\nExplanation: Add them together");
    expect(body.steps).toEqual([]);
    expect(body.provider).toBe("gemini");
  });

  test("subject-specific prompt for algebra", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockResolvedValue({
      content: JSON.stringify({
        solution: "x = 2",
        steps: ["Subtract 3", "Divide by 2"],
      }),
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({ question: "2x + 3 = 7", subject: "algebra" }),
    });
    await POST(req);

    expect(mockGenerateWithSystem).toHaveBeenCalledWith(
      expect.stringContaining("Algebra tutor"),
      expect.any(String),
      expect.any(Object),
    );
  });

  test("subject-specific prompt for calculus", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockResolvedValue({
      content: JSON.stringify({ solution: "2x", steps: ["Apply power rule"] }),
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({
        question: "Derivative of x^2",
        subject: "calculus",
      }),
    });
    await POST(req);

    expect(mockGenerateWithSystem).toHaveBeenCalledWith(
      expect.stringContaining("Calculus tutor"),
      expect.any(String),
      expect.any(Object),
    );
  });

  test("internal error returns 500", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });
    mockIsAIConfigured.mockReturnValue(true);
    mockGenerateWithSystem.mockRejectedValue(new Error("AI provider failure"));

    const req = new NextRequest("http://localhost/api/solve", {
      method: "POST",
      body: JSON.stringify({ question: "2 + 2" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Internal server error");
  });
});
