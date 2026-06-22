import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetUsage = vi.fn<(userId: string) => unknown>();
const mockGetGlobalUsage = vi.fn<() => unknown>();

vi.mock("@/lib/ai/daily-call-tracker", () => ({
  dailyCallTracker: {
    getUsage: mockGetUsage,
    getGlobalUsage: mockGetGlobalUsage,
  },
}));

const { NextRequest } = await import("next/server");
const { GET } = await import("@/app/api/engine/budget/route");

describe("GET /api/engine/budget", () => {
  beforeEach(() => {
    mockGetUsage.mockReset();
    mockGetGlobalUsage.mockReset();
  });

  test("returns user and global usage with IP from x-forwarded-for", async () => {
    mockGetUsage.mockReturnValue({
      generate: { count: 5, tokens: 500 },
      grade: { count: 3, tokens: 150 },
      hint: { count: 1, tokens: 50 },
      visual: { count: 0, tokens: 0 },
    });
    mockGetGlobalUsage.mockReturnValue({
      totalCalls: 100,
      totalTokens: 10000,
    });

    const req = new NextRequest("http://localhost/api/engine/budget", {
      headers: { "x-forwarded-for": "203.0.113.42" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(body.user).toEqual({
      id: "203.0.113.42",
      usage: {
        generate: { count: 5, tokens: 500 },
        grade: { count: 3, tokens: 150 },
        hint: { count: 1, tokens: 50 },
        visual: { count: 0, tokens: 0 },
      },
    });
    expect(body.global).toEqual({
      totalCalls: 100,
      totalTokens: 10000,
    });
  });

  test("falls back to x-real-ip when x-forwarded-for is missing", async () => {
    mockGetUsage.mockReturnValue({
      generate: { count: 0, tokens: 0 },
      grade: { count: 0, tokens: 0 },
      hint: { count: 0, tokens: 0 },
      visual: { count: 0, tokens: 0 },
    });
    mockGetGlobalUsage.mockReturnValue({ totalCalls: 0, totalTokens: 0 });

    const req = new NextRequest("http://localhost/api/engine/budget", {
      headers: { "x-real-ip": "10.0.0.1" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(body.user.id).toBe("10.0.0.1");
  });

  test("falls back to anonymous when no IP headers present", async () => {
    mockGetUsage.mockReturnValue({
      generate: { count: 0, tokens: 0 },
      grade: { count: 0, tokens: 0 },
      hint: { count: 0, tokens: 0 },
      visual: { count: 0, tokens: 0 },
    });
    mockGetGlobalUsage.mockReturnValue({ totalCalls: 0, totalTokens: 0 });

    const req = new NextRequest("http://localhost/api/engine/budget");

    const res = await GET(req);
    const body = await res.json();

    expect(body.user.id).toBe("anonymous");
  });

  test("takes first IP from comma-separated x-forwarded-for", async () => {
    mockGetUsage.mockReturnValue({
      generate: { count: 0, tokens: 0 },
      grade: { count: 0, tokens: 0 },
      hint: { count: 0, tokens: 0 },
      visual: { count: 0, tokens: 0 },
    });
    mockGetGlobalUsage.mockReturnValue({ totalCalls: 0, totalTokens: 0 });

    const req = new NextRequest("http://localhost/api/engine/budget", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });

    const res = await GET(req);
    const body = await res.json();

    expect(body.user.id).toBe("192.168.1.1");
  });

  test("calls dailyCallTracker with correct user ID", async () => {
    mockGetUsage.mockReturnValue({
      generate: { count: 0, tokens: 0 },
      grade: { count: 0, tokens: 0 },
      hint: { count: 0, tokens: 0 },
      visual: { count: 0, tokens: 0 },
    });
    mockGetGlobalUsage.mockReturnValue({ totalCalls: 0, totalTokens: 0 });

    const req = new NextRequest("http://localhost/api/engine/budget", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    await GET(req);

    expect(mockGetUsage).toHaveBeenCalledWith("1.2.3.4");
  });
});
