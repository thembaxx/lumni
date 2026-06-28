import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetAuthenticatedUserName = vi.fn<(params?: unknown) => string>();
const mockGetActiveSession = vi.fn<(params?: unknown) => unknown>();
const mockStartLiveSession = vi.fn<(params?: unknown) => unknown>();
const mockGetLiveSession = vi.fn<(params?: unknown) => unknown>();
const mockEndLiveSession = vi.fn<(params?: unknown) => unknown>();

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(async () => "user-test-1"),
  getAuthenticatedUserName: () => mockGetAuthenticatedUserName(),
}));

vi.mock("@/lib/study-groups/live-session-service", () => ({
  getActiveSession: () => mockGetActiveSession(),
  startLiveSession: () => mockStartLiveSession(),
  getLiveSession: () => mockGetLiveSession(),
  endLiveSession: () => mockEndLiveSession(),
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

vi.mock("@/lib/shared/with-rate-limit", () => ({
  withRateLimit: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/ai/with-budget", () => ({
  checkBudget: vi.fn(async () => ({ allowed: true, userId: "user-test-1" })),
  trackUsage: vi.fn(),
}));

vi.mock("@/lib/ai/call-context", () => ({
  runWithAICallContext: vi.fn(async (_ctx: unknown, fn: () => Promise<unknown>) => fn()),
}));

vi.mock("uuid", () => ({ v4: () => "test-uuid" }));

const { GET: getRoute, POST } = await import("../[groupId]/live-session/route");
const { GET: getByIdRoute, PATCH } = await import("../[groupId]/live-session/[sessionId]/route");

function makeGetRequest(url: string): NextRequest {
  return new NextRequest(new Request(url, { method: "GET" }));
}

function makePostRequest(url: string, body?: unknown): NextRequest {
  return new NextRequest(
    new Request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

function makePatchRequest(url: string, body?: unknown): NextRequest {
  return new NextRequest(
    new Request(url, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

describe("GET /api/study-groups/:groupId/live-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session when active session exists", async () => {
    mockGetActiveSession.mockResolvedValue({
      $id: "session-1",
      groupId: "group-1",
      status: "active",
    });

    const res = await getRoute(
      makeGetRequest("http://localhost/api/study-groups/group-1/live-session"),
      {
        params: { groupId: "group-1" },
      },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.session.$id).toBe("session-1");
  });

  it("returns null when no active session", async () => {
    mockGetActiveSession.mockResolvedValue(null);

    const res = await getRoute(
      makeGetRequest("http://localhost/api/study-groups/group-1/live-session"),
      {
        params: { groupId: "group-1" },
      },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.session).toBeNull();
  });
});

describe("POST /api/study-groups/:groupId/live-session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAuthenticatedUserName.mockReturnValue("Test User");
  });

  it("creates a session when no active session exists", async () => {
    mockGetActiveSession.mockResolvedValue(null);
    mockStartLiveSession.mockResolvedValue({
      $id: "session-new",
      groupId: "group-1",
      startedBy: "user-test-1",
      startedByName: "Test User",
      subject: "Mathematics",
      status: "active",
    });

    const res = await POST(
      makePostRequest("http://localhost/api/study-groups/group-1/live-session", {
        subject: "Mathematics",
      }),
      { params: { groupId: "group-1" } },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.session.status).toBe("active");
    expect(body.session.subject).toBe("Mathematics");
  });

  it("returns 409 when active session already exists", async () => {
    mockGetActiveSession.mockResolvedValue({ $id: "session-old", status: "active" });

    const res = await POST(
      makePostRequest("http://localhost/api/study-groups/group-1/live-session", {}),
      { params: { groupId: "group-1" } },
    );
    expect(res.status).toBe(409);
  });

  it("returns 500 when startLiveSession returns null", async () => {
    mockGetActiveSession.mockResolvedValue(null);
    mockStartLiveSession.mockResolvedValue(null);

    const res = await POST(
      makePostRequest("http://localhost/api/study-groups/group-1/live-session", {}),
      { params: { groupId: "group-1" } },
    );
    expect(res.status).toBe(500);
  });
});

describe("GET /api/study-groups/:groupId/live-session/:sessionId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns session by id", async () => {
    mockGetLiveSession.mockResolvedValue({ $id: "session-1", status: "active" });

    const res = await getByIdRoute(
      makeGetRequest("http://localhost/api/study-groups/group-1/live-session/session-1"),
      { params: { groupId: "group-1", sessionId: "session-1" } },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.session.$id).toBe("session-1");
  });

  it("returns 404 when session not found", async () => {
    mockGetLiveSession.mockResolvedValue(null);

    const res = await getByIdRoute(
      makeGetRequest("http://localhost/api/study-groups/group-1/live-session/nonexistent"),
      { params: { groupId: "group-1", sessionId: "nonexistent" } },
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/study-groups/:groupId/live-session/:sessionId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ends a session with action=end", async () => {
    mockEndLiveSession.mockResolvedValue(true);

    const res = await PATCH(
      makePatchRequest("http://localhost/api/study-groups/group-1/live-session/session-1", {
        action: "end",
      }),
      { params: { groupId: "group-1", sessionId: "session-1" } },
    );
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
  });

  it("returns 500 when endLiveSession fails", async () => {
    mockEndLiveSession.mockResolvedValue(false);

    const res = await PATCH(
      makePatchRequest("http://localhost/api/study-groups/group-1/live-session/session-1", {
        action: "end",
      }),
      { params: { groupId: "group-1", sessionId: "session-1" } },
    );
    expect(res.status).toBe(500);
  });

  it("returns 400 for invalid action", async () => {
    const res = await PATCH(
      makePatchRequest("http://localhost/api/study-groups/group-1/live-session/session-1", {
        action: "invalid",
      }),
      { params: { groupId: "group-1", sessionId: "session-1" } },
    );
    expect(res.status).toBe(400);
  });
});
