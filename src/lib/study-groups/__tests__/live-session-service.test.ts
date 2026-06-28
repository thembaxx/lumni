import { beforeEach, describe, expect, it, vi } from "vitest";

const mockDocs: Record<string, Record<string, unknown>[]> = {};

vi.mock("@/lib/db/client", () => ({
  COLLECTIONS: { LIVE_SESSIONS: "live_sessions" },
  createDocument: vi.fn(async (_collection: string, data: Record<string, unknown>) => {
    const id = `session_${Date.now()}`;
    if (!mockDocs.live_sessions) mockDocs.live_sessions = [];
    mockDocs.live_sessions.push({ $id: id, ...data });
    return id;
  }),
  getDocument: vi.fn(async (_collection: string, id: string) => {
    const docs = mockDocs.live_sessions ?? [];
    return docs.find((d) => d.$id === id) ?? null;
  }),
  listDocuments: vi.fn(async (_collection: string, filters?: string[]) => {
    const docs = mockDocs.live_sessions ?? [];
    if (!filters || filters.length === 0) return docs.map((d) => ({ ...d }));
    return docs
      .filter((d) =>
        filters.every((f) => {
          const match = f.match(/^equal\("([^"]+)",\s*"([^"]+)"\)$/);
          if (!match) return true;
          return String(d[match[1]]) === match[2];
        }),
      )
      .map((d) => ({ ...d }));
  }),
  updateDocument: vi.fn(async (_collection: string, id: string, data: Record<string, unknown>) => {
    const docs = mockDocs.live_sessions ?? [];
    const idx = docs.findIndex((d) => d.$id === id);
    if (idx >= 0) Object.assign(docs[idx], data);
  }),
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

const { startLiveSession, endLiveSession, getLiveSession, getActiveSession } =
  await import("../live-session-service");

describe("LiveSessionService", () => {
  beforeEach(() => {
    for (const key of Object.keys(mockDocs)) delete mockDocs[key];
    vi.clearAllMocks();
  });

  describe("startLiveSession", () => {
    it("creates a session with active status", async () => {
      const session = await startLiveSession("group-1", "user-1", "Alice", "Mathematics");
      expect(session).not.toBeNull();
      expect(session!.groupId).toBe("group-1");
      expect(session!.startedBy).toBe("user-1");
      expect(session!.startedByName).toBe("Alice");
      expect(session!.subject).toBe("Mathematics");
      expect(session!.status).toBe("active");
      expect(session!.startedAt).toBeDefined();
    });

    it("defaults optional fields to empty strings", async () => {
      const session = await startLiveSession("group-2", "user-2");
      expect(session).not.toBeNull();
      expect(session!.startedByName).toBe("");
      expect(session!.subject).toBe("");
    });

    it("returns null on DB error", async () => {
      const { createDocument } = await import("@/lib/db/client");
      vi.mocked(createDocument).mockRejectedValueOnce(new Error("DB error"));
      const session = await startLiveSession("group-1", "user-1");
      expect(session).toBeNull();
    });
  });

  describe("endLiveSession", () => {
    it("updates status to ended and sets endedAt", async () => {
      const session = await startLiveSession("group-1", "user-1");
      const ok = await endLiveSession(session!.$id);
      expect(ok).toBe(true);

      const ended = await getLiveSession(session!.$id);
      expect(ended!.status).toBe("ended");
      expect(ended!.endedAt).toBeDefined();
    });

    it("returns false on DB error", async () => {
      const { updateDocument } = await import("@/lib/db/client");
      vi.mocked(updateDocument).mockRejectedValueOnce(new Error("DB error"));
      const ok = await endLiveSession("nonexistent");
      expect(ok).toBe(false);
    });
  });

  describe("getLiveSession", () => {
    it("returns null for nonexistent session", async () => {
      const session = await getLiveSession("nonexistent");
      expect(session).toBeNull();
    });

    it("returns session by id", async () => {
      const created = await startLiveSession("group-1", "user-1");
      const fetched = await getLiveSession(created!.$id);
      expect(fetched).not.toBeNull();
      expect(fetched!.$id).toBe(created!.$id);
    });
  });

  describe("getActiveSession", () => {
    it("returns null when no active session exists", async () => {
      const session = await getActiveSession("group-empty");
      expect(session).toBeNull();
    });

    it("returns the active session for a group", async () => {
      await startLiveSession("group-1", "user-1");
      const active = await getActiveSession("group-1");
      expect(active).not.toBeNull();
      expect(active!.status).toBe("active");
      expect(active!.groupId).toBe("group-1");
    });

    it("does not return ended sessions", async () => {
      const session = await startLiveSession("group-1", "user-1");
      await endLiveSession(session!.$id);
      const active = await getActiveSession("group-1");
      expect(active).toBeNull();
    });
  });
});
