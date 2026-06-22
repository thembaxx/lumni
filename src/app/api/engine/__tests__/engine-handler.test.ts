import { beforeEach, describe, expect, test, vi } from "vitest";

const mockCheckBudget = vi.fn<(req: unknown, type: string) => unknown>();
const mockTrackUsage = vi.fn<(type: string, userId: string) => void>();
const mockWithRateLimit = vi.fn((handler: unknown) => handler);

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: mockCheckBudget,
  trackUsage: mockTrackUsage,
}));

vi.mock("@/lib/shared/with-rate-limit", () => ({
  withRateLimit: mockWithRateLimit,
}));

const { NextRequest, NextResponse } = await import("next/server");
const { createRouteHandler } = await import("@/lib/api/create-route-handler");

function createHandler(config: Record<string, unknown>) {
  return createRouteHandler({
    auth: "none",
    errorLabel: "Test",
    parseBody: async () => ({}),
    validate: () => null,
    ...config,
  });
}

describe("createRouteHandler with budget config", () => {
  beforeEach(() => {
    mockCheckBudget.mockReset();
    mockTrackUsage.mockReset();
    mockWithRateLimit.mockReset();
    mockWithRateLimit.mockImplementation((handler: unknown) => handler);
  });

  test("budget allowed calls parseBody, validate, execute, returns result", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const parseBody = vi.fn(async () => ({ subject: "math", count: 2 }));
    const validate = vi.fn(() => null);
    const execute = vi.fn(async () => ({ questions: [], count: 2 }));

    const handler = createHandler({
      budget: "generate",
      parseBody,
      validate,
      execute,
    });

    const req = new NextRequest("http://localhost/api/engine/test", {
      method: "POST",
      body: JSON.stringify({ subject: "math", count: 2 }),
    });

    const res = await handler(req);
    const body = await res.json();

    expect(parseBody).toHaveBeenCalledTimes(1);
    expect(validate).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      expect.objectContaining({
        body: { subject: "math", count: 2 },
        userId: "test-user",
      }),
    );
    expect(body).toEqual({ questions: [], count: 2 });
    expect(mockTrackUsage).toHaveBeenCalledWith("generate", "test-user");
  });

  test("budget denied returns 429 and execute not called", async () => {
    mockCheckBudget.mockResolvedValue({
      allowed: false,
      userId: "test-user",
      response: NextResponse.json({ error: "Daily generation limit reached" }, { status: 429 }),
    });

    const execute = vi.fn(async () => ({ ok: true }));
    const handler = createHandler({
      budget: "generate",
      execute,
    });

    const req = new NextRequest("http://localhost/api/engine/test", {
      method: "POST",
    });

    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body).toEqual({ error: "Daily generation limit reached" });
    expect(execute).not.toHaveBeenCalled();
    expect(mockTrackUsage).not.toHaveBeenCalled();
  });

  test("validation fails returns 400 and execute not called", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const execute = vi.fn(async () => ({ ok: true }));
    const handler = createHandler({
      budget: "generate",
      parseBody: async () => ({ subject: "" }),
      validate: (body: { subject?: string }) => (!body.subject ? "Subject is required" : null),
      execute,
    });

    const req = new NextRequest("http://localhost/api/engine/test", {
      method: "POST",
    });

    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "Subject is required" });
    expect(execute).not.toHaveBeenCalled();
  });

  test("execute throws returns 500 with error message", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const execute = vi.fn(async () => {
      throw new Error("Something went wrong");
    });
    const handler = createHandler({
      budget: "generate",
      execute,
    });

    const req = new NextRequest("http://localhost/api/engine/test", {
      method: "POST",
    });

    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Something went wrong" });
  });

  test("execute throws non-Error returns 500 with generic message", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const execute = vi.fn(async () => {
      throw "string error";
    });
    const handler = createHandler({
      budget: "generate",
      errorLabel: "Generate",
      execute,
    });

    const req = new NextRequest("http://localhost/api/engine/test", {
      method: "POST",
    });

    const res = await handler(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ error: "Failed to generate" });
  });

  test("useRateLimit false skips rate limit wrapping", async () => {
    const _handler = createHandler({
      budget: "generate",
      useRateLimit: false,
      execute: async () => ({ ok: true }),
    });

    expect(mockWithRateLimit).not.toHaveBeenCalled();
  });

  test("trackUsage called after successful execution", async () => {
    mockCheckBudget.mockResolvedValue({ allowed: true, userId: "test-user" });

    const handler = createHandler({
      budget: "hint",
      parseBody: async () => ({ question: { id: "q1" } }),
      execute: async () => ({ hint: "Think harder" }),
    });

    const req = new NextRequest("http://localhost/api/engine/test", {
      method: "POST",
    });

    await handler(req);

    expect(mockTrackUsage).toHaveBeenCalledWith("hint", "test-user");
  });
});
