import { nanoid } from "nanoid";
import { dexieDataAccess } from "@/lib/db";
import type {
  CollaborativeSession,
  SessionParticipant,
  WhiteboardObject,
  SessionInvite,
  CollaborativeSessionConfig,
  SessionMessage,
  SessionRecording,
} from "./types";
import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const INVITE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type CollaborativeDb = DataAccess & {
  collaborativeSessions: any;
  sessionParticipants: any;
  whiteboardObjects: any;
  sessionMessages: any;
  sessionRecordings: any;
  sessionInvites: any;
};

let _deps: { db: CollaborativeDb } = Object.freeze({
  db: dexieDataAccess as unknown as CollaborativeDb,
});
export function __setDepsForTesting(deps: { db: CollaborativeDb }) {
  _deps = Object.freeze({ ...deps });
}

export class CollaborativeSessionService {
  private db: CollaborativeDb;

  constructor(deps?: { db?: CollaborativeDb }) {
    this.db = deps?.db ?? _deps.db;
  }

  async createSession(
    hostId: string,
    hostName: string,
    groupId: string,
    config: CollaborativeSessionConfig,
  ): Promise<CollaborativeSession> {
    const now = Date.now();
    const session: CollaborativeSession = {
      id: `session_${nanoid(12)}`,
      groupId,
      hostId,
      hostName,
      subject: config.subject,
      topic: config.topic,
      status: "waiting",
      createdAt: now,
      maxParticipants: config.maxParticipants ?? 4,
      currentParticipants: 0,
      recordingEnabled: config.recordingEnabled ?? true,
    };

    await this.db.collaborativeSessions.add(session);

    // Create invite code
    if (config.inviteCode) {
      const invite: SessionInvite = {
        code: config.inviteCode,
        sessionId: session.id,
        groupId,
        createdBy: hostId,
        createdAt: now,
        expiresAt: now + INVITE_EXPIRY_MS,
        maxUses: config.maxParticipants ?? 10,
        usedCount: 0,
      };
      await this.db.sessionInvites.add(invite);
    }

    return session;
  }

  async getSession(sessionId: string): Promise<CollaborativeSession | undefined> {
    return this.db.collaborativeSessions.get(sessionId);
  }

  async getGroupSessions(groupId: string): Promise<CollaborativeSession[]> {
    return this.db.collaborativeSessions
      .where("groupId")
      .equals(groupId)
      .reverse()
      .sortBy("createdAt");
  }

  async startSession(sessionId: string): Promise<void> {
    await this.db.collaborativeSessions.update(sessionId, {
      status: "active",
      startedAt: Date.now(),
    });
  }

  async endSession(sessionId: string): Promise<void> {
    await this.db.collaborativeSessions.update(sessionId, {
      status: "ended",
      endedAt: Date.now(),
    });
  }

  async joinSession(
    sessionId: string,
    userId: string,
    userName: string,
    avatarUrl?: string,
  ): Promise<SessionParticipant> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status === "ended") throw new Error("Session has ended");
    if (session.currentParticipants >= session.maxParticipants) {
      throw new Error("Session is full");
    }

    const participant: SessionParticipant = {
      userId,
      userName,
      avatarUrl,
      role: userId === session.hostId ? "host" : "participant",
      joinedAt: Date.now(),
      isMuted: false,
      isVideoEnabled: false,
    };

    await this.db.sessionParticipants.add({ sessionId, ...participant });

    await this.db.collaborativeSessions.update(sessionId, {
      currentParticipants: session.currentParticipants + 1,
    });

    return participant;
  }

  async leaveSession(sessionId: string, userId: string): Promise<void> {
    await this.db.sessionParticipants.where({ sessionId, userId }).delete();

    const session = await this.getSession(sessionId);
    if (session) {
      await this.db.collaborativeSessions.update(sessionId, {
        currentParticipants: Math.max(0, session.currentParticipants - 1),
      });
    }
  }

  async getParticipants(sessionId: string): Promise<SessionParticipant[]> {
    return this.db.sessionParticipants.where("sessionId").equals(sessionId).toArray();
  }

  async updateParticipant(
    sessionId: string,
    userId: string,
    updates: Partial<SessionParticipant>,
  ): Promise<void> {
    await this.db.sessionParticipants.where({ sessionId, userId }).modify(updates);
  }

  async addWhiteboardObject(
    sessionId: string,
    object: Omit<WhiteboardObject, "id" | "createdAt" | "updatedAt">,
  ): Promise<WhiteboardObject> {
    const now = Date.now();
    const whiteboardObject: WhiteboardObject = {
      ...object,
      id: `obj_${nanoid(12)}`,
      createdAt: now,
      updatedAt: now,
    };
    await this.db.whiteboardObjects.add({ sessionId, ...whiteboardObject });
    return whiteboardObject;
  }

  async updateWhiteboardObject(
    sessionId: string,
    objectId: string,
    updates: Partial<WhiteboardObject>,
  ): Promise<void> {
    await this.db.whiteboardObjects
      .where({ sessionId, id: objectId })
      .modify({ ...updates, updatedAt: Date.now() });
  }

  async deleteWhiteboardObject(sessionId: string, objectId: string): Promise<void> {
    await this.db.whiteboardObjects.where({ sessionId, id: objectId }).delete();
  }

  async getWhiteboardObjects(sessionId: string): Promise<WhiteboardObject[]> {
    return this.db.whiteboardObjects.where("sessionId").equals(sessionId).toArray();
  }

  async addMessage(
    sessionId: string,
    message: Omit<SessionMessage, "id" | "timestamp">,
  ): Promise<SessionMessage> {
    const sessionMessage: SessionMessage = {
      ...message,
      id: `msg_${nanoid(12)}`,
      timestamp: Date.now(),
    };
    await this.db.sessionMessages.add({ sessionId, ...sessionMessage });
    return sessionMessage;
  }

  async getMessages(sessionId: string, limit = 100): Promise<SessionMessage[]> {
    return this.db.sessionMessages
      .where("sessionId")
      .equals(sessionId)
      .reverse()
      .limit(limit)
      .toArray();
  }

  async startRecording(sessionId: string, hostId: string): Promise<SessionRecording> {
    const recording: SessionRecording = {
      id: `rec_${nanoid(12)}`,
      sessionId,
      hostId,
      startedAt: Date.now(),
      duration: 0,
      size: 0,
      chunks: [],
      status: "recording",
    };
    await this.db.sessionRecordings.add(recording);
    return recording;
  }

  async addRecordingChunk(
    recordingId: string,
    chunk: Omit<SessionRecording["chunks"][0], "id" | "recordingId">,
  ): Promise<void> {
    const fullChunk = { ...chunk, id: `chunk_${nanoid(12)}`, recordingId };
    await this.db.sessionRecordings.update(recordingId, (rec) => {
      if (!rec) return;
      rec.chunks.push(fullChunk);
      rec.size += chunk.blobUrl.length; // approximate
      rec.duration = chunk.endTime - rec.startedAt;
    });
  }

  async stopRecording(recordingId: string): Promise<void> {
    await this.db.sessionRecordings.update(recordingId, {
      status: "processing",
      endedAt: Date.now(),
    });
  }

  async getRecording(recordingId: string): Promise<SessionRecording | undefined> {
    return this.db.sessionRecordings.get(recordingId);
  }

  async getSessionRecordings(sessionId: string): Promise<SessionRecording[]> {
    return this.db.sessionRecordings.where("sessionId").equals(sessionId).toArray();
  }

  async createInvite(
    sessionId: string,
    groupId: string,
    createdBy: string,
    maxUses = 10,
  ): Promise<SessionInvite> {
    const now = Date.now();
    const invite: SessionInvite = {
      code: `inv_${nanoid(8).toUpperCase()}`,
      sessionId,
      groupId,
      createdBy,
      createdAt: now,
      expiresAt: now + INVITE_EXPIRY_MS,
      maxUses,
      usedCount: 0,
    };
    await this.db.sessionInvites.add(invite);
    return invite;
  }

  async getInvite(code: string): Promise<SessionInvite | undefined> {
    return this.db.sessionInvites.where("code").equals(code).first();
  }

  async useInvite(code: string): Promise<SessionInvite | undefined> {
    const invite = await this.getInvite(code);
    if (!invite) return undefined;
    if (invite.expiresAt < Date.now()) return undefined;
    if (invite.usedCount >= invite.maxUses) return undefined;

    await this.db.sessionInvites.update(invite.code, {
      usedCount: invite.usedCount + 1,
    });
    return { ...invite, usedCount: invite.usedCount + 1 };
  }

  async cleanupExpiredSessions(): Promise<number> {
    const expiry = Date.now() - SESSION_EXPIRY_MS;
    const expired = await this.db.collaborativeSessions.where("createdAt").below(expiry).toArray();

    for (const session of expired) {
      await this.db.collaborativeSessions.delete(session.id);
    }

    return expired.length;
  }

  async cleanupExpiredInvites(): Promise<number> {
    const now = Date.now();
    const expired = await this.db.sessionInvites.where("expiresAt").below(now).toArray();

    for (const invite of expired) {
      await this.db.sessionInvites.delete(invite.code);
    }

    return expired.length;
  }
}

export const collaborativeSessionService = new CollaborativeSessionService();
