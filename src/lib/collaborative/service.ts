import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import type { CollaborativeSession, SessionParticipant, SessionMessage } from "./types";
import { logError } from "@/lib/shared/logger";

interface WhiteboardElement {
  id: string;
  sessionId?: string;
  type: string;
  data: Record<string, unknown>;
  userId: string;
  timestamp: number;
}

type CollaborativeDb = DataAccess & {
  studySessions: any;
  whiteboardElements: any;
  sessionMessages: any;
};

const DEFAULT_SETTINGS = {
  maxParticipants: 6,
  allowVoiceChat: true,
  allowWhiteboard: true,
  allowScreenShare: true,
  recordSession: false,
};

const PARTICIPANT_COLORS = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
];

export class CollaborativeService {
  private db: CollaborativeDb;

  constructor(deps?: { db?: DataAccess }) {
    this.db = (deps?.db ?? dexieDataAccess) as unknown as CollaborativeDb;
  }

  async createSession(
    userId: string,
    userName: string,
    request: {
      subject: string;
      topic?: string;
      groupId: string;
      settings?: Record<string, unknown>;
      inviteCode?: string;
    },
  ): Promise<CollaborativeSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const now = Date.now();

    const hostParticipant: Record<string, unknown> = {
      userId,
      name: userName,
      role: "host",
      joinedAt: now,
      color: PARTICIPANT_COLORS[0],
    };

    const session: Record<string, unknown> = {
      id: sessionId,
      groupId: request.groupId,
      hostId: userId,
      hostName: userName,
      subject: request.subject,
      topic: request.topic,
      status: "waiting",
      createdAt: now,
      participants: [hostParticipant],
      settings: { ...DEFAULT_SETTINGS, ...request.settings },
    };

    await this.db.studySessions.add(session);
    return session as unknown as CollaborativeSession;
  }

  async getSession(sessionId: string): Promise<CollaborativeSession | undefined> {
    return this.db.studySessions.get(sessionId);
  }

  async getGroupSessions(groupId: string): Promise<CollaborativeSession[]> {
    return this.db.studySessions.where("groupId").equals(groupId).reverse().sortBy("createdAt");
  }

  async joinSession(
    sessionId: string,
    userId: string,
    userName: string,
  ): Promise<{ session: CollaborativeSession; participant: SessionParticipant } | null> {
    const session = await this.db.studySessions.get(sessionId);
    if (!session) return null;
    if (session.status === "ended") return null;

    const existingIndex = session.participants.findIndex((p: any) => p.userId === userId);
    if (existingIndex >= 0) {
      const participant = session.participants[existingIndex];
      if (participant.leftAt) {
        // Rejoining
        session.participants[existingIndex] = {
          ...participant,
          leftAt: undefined,
          joinedAt: Date.now(),
        };
      }
      await this.db.studySessions.put(session);
      return { session, participant: session.participants[existingIndex] };
    }

    if (session.participants.length >= session.settings.maxParticipants) {
      throw new Error("Session is full");
    }

    const participant: Record<string, unknown> = {
      userId,
      name: userName,
      role: "participant",
      joinedAt: Date.now(),
      color:
        PARTICIPANT_COLORS[(session.participants as unknown[]).length % PARTICIPANT_COLORS.length],
    };

    session.participants.push(participant);
    await this.db.studySessions.put(session);

    return { session, participant: participant as any };
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.db.studySessions.get(sessionId);
    if (!session) return;

    const participantIndex = session.participants.findIndex((p: any) => p.userId === userId);
    if (participantIndex >= 0) {
      session.participants[participantIndex] = {
        ...session.participants[participantIndex],
        leftAt: Date.now(),
      };
    }

    // If host leaves, end session or transfer host
    if (session.hostId === userId && session.status === "active") {
      const remaining = session.participants.filter((p: any) => p.userId !== userId && !p.leftAt);
      if (remaining.length > 0) {
        session.hostId = remaining[0].userId;
        session.hostName = remaining[0].name;
      } else {
        session.status = "ended";
        session.endedAt = Date.now();
      }
    }

    await this.db.studySessions.put(session);
  }

  async startSession(sessionId: string, userId: string): Promise<CollaborativeSession | null> {
    const session = await this.db.studySessions.get(sessionId);
    if (!session) return null;
    if (session.hostId !== userId) throw new Error("Only host can start session");

    session.status = "active";
    session.startedAt = Date.now();
    await this.db.studySessions.put(session);
    return session;
  }

  async endSession(sessionId: string, userId: string): Promise<void> {
    const session = await this.db.studySessions.get(sessionId);
    if (!session) return;
    if (session.hostId !== userId) throw new Error("Only host can end session");

    session.status = "ended";
    session.endedAt = Date.now();
    session.participants = session.participants.map((p: any) => ({
      ...p,
      leftAt: p.leftAt ?? Date.now(),
    }));
    await this.db.studySessions.put(session);
  }

  async updateParticipantCursor(
    sessionId: string,
    userId: string,
    cursor: { x: number; y: number },
  ): Promise<void> {
    const session = await this.db.studySessions.get(sessionId);
    if (!session) return;

    const participant = session.participants.find((p: any) => p.userId === userId);
    if (participant) {
      participant.cursor = cursor;
      await this.db.studySessions.put(session);
    }
  }

  async addWhiteboardElement(sessionId: string, element: WhiteboardElement): Promise<void> {
    const session = await this.db.studySessions.get(sessionId);
    if (!session) return;

    // Store in separate whiteboard elements table or as part of session
    await this.db.whiteboardElements.add({
      ...element,
      sessionId,
    });
  }

  async getWhiteboardElements(sessionId: string): Promise<WhiteboardElement[]> {
    return this.db.whiteboardElements.where("sessionId").equals(sessionId).sortBy("timestamp");
  }

  async addMessage(
    sessionId: string,
    userId: string,
    userName: string,
    type: SessionMessage["type"],
    content: string,
  ): Promise<void> {
    await this.db.sessionMessages.add({
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      sessionId,
      userId,
      userName,
      type,
      content,
      timestamp: Date.now(),
    });
  }

  async getMessages(sessionId: string, limit = 100): Promise<SessionMessage[]> {
    return this.db.sessionMessages
      .where("sessionId")
      .equals(sessionId)
      .limit(limit)
      .reverse()
      .sortBy("timestamp");
  }

  async cleanupOldSessions(olderThanDays = 30): Promise<number> {
    const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
    const oldSessions = await this.db.studySessions
      .where("createdAt")
      .below(cutoff)
      .and((s: any) => s.status === "ended")
      .toArray();

    if (oldSessions.length === 0) return 0;

    await this.db.studySessions.bulkDelete(oldSessions.map((s: any) => s.id));
    return oldSessions.length;
  }
}

export const collaborativeService = new CollaborativeService();
