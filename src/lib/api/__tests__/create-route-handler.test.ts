import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(async () => "user_test"),
  requireAdmin: vi.fn(async () => {
    throw new Error("Authentication required");
  }),
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/shared/with-rate-limit", () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: vi.fn(async () => ({ allowed: true, userId: "user_test" })),
  trackUsage: vi.fn(),
}));

vi.mock("@/lib/ai/call-context", () => ({
  runWithAICallContext: vi.fn(async (_ctx: unknown, fn: () => Promise<unknown>) => fn()),
}));

vi.mock("uuid", () => ({
  v4: () => "test-uuid-1234",
}));

import { createRouteHandler, HttpError, isSafeString, isValidEmail, sanitizeEmail } from "../create-route-handler";

function makeGetRequest(path = "/api/test"): NextRequest {
  return new NextRequest(new Request(`http://localhost${path}`, { method: "GET" }));
}

function makePostRequest(body?: unknown, path = "/api/test"): NextRequest {
  return new NextRequest(
    new Request(`http://localhost${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

describe("isSafeString", () => {
  it("accepts normal strings", () => {
    expect(isSafeString("hello world")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isSafeString("")).toBe(false);
  });

  it("rejects strings with angle brackets", () => {
    expect(isSafeString("<script>")).toBe(false);
  });

  it("rejects strings with quotes", () => {
    expect(isSafeString('test"quote')).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isSafeString(123)).toBe(false);
    expect(isSafeString(null)).toBe(false);
    expect(isSafeString(undefined)).toBe(false);
  });

  it("rejects strings over 1000 chars", () => {
    expect(isSafeString("a".repeat(1001))).toBe(false);
  });
});

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("missing@")).toBe(false);
    expect(isValidEmail("@missing.com")).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(isValidEmail(123)).toBe(false);
  });

  it("rejects emails over 254 chars", () => {
    expect(isValidEmail(`${"a".repeat(245)}@example.com`)).toBe(false);
  });
});

describe("sanitizeEmail", () => {
  it("lowercases and trims", () => {
    expect(sanitizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
  });
});

describe("createRouteHandler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns result from execute for GET requests", async () => {
    const handler = createRouteHandler({
      auth: "none",
      execute: () => ({ hello: "world" }),
    });
    const res = await handler(makeGetRequest());
    const json = await res.json();
    expect(json.hello).toBe("world");
  });

  it("returns 400 for invalid JSON on POST", async () => {
    const handler = createRouteHandler({
      auth: "none",
      execute: () => ({}),
    });
    const req = new NextRequest(
      new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "not json",
      }),
    );
    const res = await handler(req);
    expect(res.status).toBe(400);
  });

  it("calls validate and returns 400 on failure", async () => {
    const handler = createRouteHandler({
      auth: "none",
      validate: () => "Name is required",
      execute: () => ({}),
    });
    const res = await handler(makePostRequest({ name: "" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Name is required");
  });

  it("passes body from parseBody", async () => {
    const handler = createRouteHandler({
      auth: "none",
      parseBody: async () => ({ parsed: true }),
      execute: ({ body }) => body,
    });
    const res = await handler(makePostRequest());
    const json = await res.json();
    expect(json.parsed).toBe(true);
  });

  it("sets security headers on response", async () => {
    const handler = createRouteHandler({
      auth: "none",
      execute: () => ({}),
    });
    const res = await handler(makeGetRequest());
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(res.headers.get("X-Frame-Options")).toBe("DENY");
    expect(res.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
  });

  it("generates requestId when generateRequestId is true", async () => {
    const handler = createRouteHandler({
      auth: "none",
      generateRequestId: true,
      execute: ({ requestId }) => ({ requestId }),
    });
    const res = await handler(makeGetRequest());
    const json = await res.json();
    expect(json.requestId).toBe("test-uuid-1234");
  });

  it("serializes array results into { data: [...] }", async () => {
    const handler = createRouteHandler({
      auth: "none",
      execute: () => [1, 2, 3],
    });
    const res = await handler(makeGetRequest());
    const json = await res.json();
    expect(json.data).toEqual([1, 2, 3]);
  });

  it("serializes null results into {}", async () => {
    const handler = createRouteHandler({
      auth: "none",
      execute: () => null,
    });
    const res = await handler(makeGetRequest());
    const json = await res.json();
    expect(json).toEqual({});
  });

  it("catches HttpError and returns proper status", async () => {
    const handler = createRouteHandler({
      auth: "none",
      execute: () => {
        throw new HttpError(404, "Not found");
      },
    });
    const res = await handler(makeGetRequest());
    expect(res.status).toBe(404);
  });
});
