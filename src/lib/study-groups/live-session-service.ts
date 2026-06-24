import { Query } from "appwrite";
import {
  COLLECTIONS,
  createDocument,
  getDocument,
  listDocuments,
  updateDocument,
} from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import type { LiveSession } from "./live-session-types";

export async function startLiveSession(
  groupId: string,
  userId: string,
  userName?: string,
  subject?: string,
): Promise<LiveSession | null> {
  try {
    const id = await createDocument(COLLECTIONS.LIVE_SESSIONS, {
      groupId,
      startedBy: userId,
      startedByName: userName ?? "",
      subject: subject ?? "",
      status: "active",
      startedAt: new Date().toISOString(),
    });
    if (!id) return null;
    return getLiveSession(id);
  } catch (err) {
    logError("LiveSessionService.start", err);
    return null;
  }
}

export async function endLiveSession(sessionId: string): Promise<boolean> {
  try {
    await updateDocument(COLLECTIONS.LIVE_SESSIONS, sessionId, {
      status: "ended",
      endedAt: new Date().toISOString(),
    });
    return true;
  } catch (err) {
    logError("LiveSessionService.end", err);
    return false;
  }
}

export async function getLiveSession(sessionId: string): Promise<LiveSession | null> {
  try {
    return await getDocument<LiveSession>(COLLECTIONS.LIVE_SESSIONS, sessionId);
  } catch (e) {
    logError("LiveSession.get", e);
    return null;
  }
}

export async function getSessionsByTeacher(teacherId: string): Promise<LiveSession[]> {
  try {
    const relationships = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
      Query.equal("teacherId", teacherId),
    ]);
    if (relationships.length === 0) return [];

    const studentIds = relationships.map((r) => (r as Record<string, unknown>).studentId as string);

    const membersByStudent = await Promise.all(
      studentIds.map((sid) =>
        listDocuments(COLLECTIONS.GROUP_MEMBERS, [Query.equal("userId", sid)]),
      ),
    );

    const groupIds = [
      ...new Set(
        membersByStudent.flat().map((m) => (m as Record<string, unknown>).groupId as string),
      ),
    ];

    if (groupIds.length === 0) return [];

    const sessionsByGroup = await Promise.all(
      groupIds.map((gid) =>
        listDocuments<LiveSession>(COLLECTIONS.LIVE_SESSIONS, [
          Query.equal("groupId", gid),
          Query.equal("status", "active"),
          Query.orderDesc("startedAt"),
        ]),
      ),
    );

    return sessionsByGroup.flat();
  } catch (err) {
    logError("LiveSessionService.getSessionsByTeacher", err);
    return [];
  }
}

export async function getActiveSession(groupId: string): Promise<LiveSession | null> {
  try {
    const sessions = await listDocuments<LiveSession>(COLLECTIONS.LIVE_SESSIONS, [
      `equal("groupId", "${groupId}")`,
      `equal("status", "active")`,
      'orderDesc("startedAt")',
      "limit(1)",
    ]);
    return sessions[0] ?? null;
  } catch (e) {
    logError("LiveSession.getActive", e);
    return null;
  }
}
