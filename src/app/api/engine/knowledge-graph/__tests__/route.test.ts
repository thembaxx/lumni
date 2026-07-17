import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetAuthenticatedUserId = vi.hoisted(() => vi.fn<() => string | null>());
const mockGetCachedGraph = vi.hoisted(() => vi.fn());
const mockFetchGraph = vi.hoisted(() => vi.fn());
const mockStoreGraph = vi.hoisted(() => vi.fn());
const mockEnsureAI = vi.hoisted(() => vi.fn());

vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: mockGetAuthenticatedUserId,
}));

vi.mock("@/lib/knowledge-graph/service", () => ({
  getCachedGraph: mockGetCachedGraph,
  fetchGraph: mockFetchGraph,
  storeGraph: mockStoreGraph,
}));

vi.mock("@/lib/ai", () => ({
  ensureAI: mockEnsureAI,
}));

const { NextRequest } = await import("next/server");
const { GET } = await import("@/app/api/engine/knowledge-graph/route");

const MOCK_GRAPH = {
  nodes: [
    { id: "1", label: "Algebra", type: "prerequisite" as const },
    { id: "2", label: "Calculus", type: "core" as const },
  ],
  edges: [{ from: "1", to: "2", relation: "prerequisite_for" }],
};

describe("GET /api/engine/knowledge-graph", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns 401 when unauthenticated", async () => {
    mockGetAuthenticatedUserId.mockReturnValue(null);

    const req = new NextRequest(
      "http://localhost/api/engine/knowledge-graph?subject=math&topic=algebra",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: "Not authenticated" });
  });

  test("returns 400 when subject is missing", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("test-user-id");

    const req = new NextRequest("http://localhost/api/engine/knowledge-graph");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "subject and topic are required" });
  });

  test("returns 400 when topic is missing", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("test-user-id");

    const req = new NextRequest("http://localhost/api/engine/knowledge-graph?subject=math");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body).toEqual({ error: "subject and topic are required" });
  });

  test("returns cached graph when available", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("test-user-id");
    mockGetCachedGraph.mockResolvedValue(MOCK_GRAPH);

    const req = new NextRequest(
      "http://localhost/api/engine/knowledge-graph?subject=math&topic=algebra",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(MOCK_GRAPH);
    expect(mockGetCachedGraph).toHaveBeenCalledWith("math", "algebra");
    expect(mockFetchGraph).not.toHaveBeenCalled();
  });

  test("generates graph via AI when cache misses", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("test-user-id");
    mockGetCachedGraph.mockResolvedValue(null);
    mockEnsureAI.mockReturnValue(true);
    mockFetchGraph.mockResolvedValue(MOCK_GRAPH);
    mockStoreGraph.mockResolvedValue(undefined);

    const req = new NextRequest(
      "http://localhost/api/engine/knowledge-graph?subject=math&topic=algebra",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(MOCK_GRAPH);
    expect(mockFetchGraph).toHaveBeenCalledWith("math", "algebra");
    expect(mockStoreGraph).toHaveBeenCalledWith("math", "algebra", MOCK_GRAPH);
  });

  test("returns empty graph when AI generates empty graph", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("test-user-id");
    mockGetCachedGraph.mockResolvedValue(null);
    mockEnsureAI.mockReturnValue(true);
    mockFetchGraph.mockResolvedValue({ nodes: [], edges: [] });

    const req = new NextRequest(
      "http://localhost/api/engine/knowledge-graph?subject=math&topic=algebra",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ nodes: [], edges: [] });
  });

  test("returns empty graph when AI is unavailable", async () => {
    mockGetAuthenticatedUserId.mockReturnValue("test-user-id");
    mockGetCachedGraph.mockResolvedValue(null);
    mockEnsureAI.mockReturnValue(false);

    const req = new NextRequest(
      "http://localhost/api/engine/knowledge-graph?subject=math&topic=algebra",
    );
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ nodes: [], edges: [] });
    expect(mockFetchGraph).not.toHaveBeenCalled();
  });
});
