import { NextRequest } from "next/server";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("../rate-limit", () => ({
  checkRateLimit: vi.fn(),
  getRateLimitHeaders: vi.fn(() => ({})),
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

const { checkRateLimit } = await import("../rate-limit");
const { logError } = await import("@/lib/shared/logger");
const { withRateLimit } = await import("../with-rate-limit");

function makeReq(ip?: string): NextRequest {
  const headers = new Headers();
  if (ip) headers.set("x-forwarded-for", ip);
  return new NextRequest("https://example.com/api/test", { headers });
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("withRateLimit", () => {
  test("returns 200 when checkRateLimit throws (fail-open)", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("store down"));

    const handler = withRateLimit(async () => new Response("ok"));
    const res = await handler(makeReq("1.2.3.4"));

    expect(res.status).toBe(200);
    expect(logError).toHaveBeenCalledWith("RateLimit", expect.any(Error));
  });

  test("passes through when checkRateLimit allows", async () => {
    (checkRateLimit as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: true,
      remaining: 9,
      resetAt: Date.now() + 60_000,
    });

    const handler = withRateLimit(async () => new Response("ok"));
    const res = await handler(makeReq("1.2.3.4"));

    expect(res.status).toBe(200);
    expect(logError).not.toHaveBeenCalled();
  });
});
