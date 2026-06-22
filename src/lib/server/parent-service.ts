import { Query } from "appwrite";
import { Users } from "node-appwrite";
import { serverClient } from "@/lib/appwrite.server";
import { COLLECTIONS, createDocument, listDocuments, updateDocument } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

export interface ParentStudent {
  id: string;
  name: string;
  initials: string;
  grade: string;
}

export interface ChildSubjectProgress {
  subject: string;
  score: number;
  topicsStudied: number;
  totalTopics: number;
  lastStudied: string;
}

export interface ActivityItem {
  id: string;
  type: "quiz" | "flashcard" | "exam" | "planner";
  description: string;
  timestamp: string;
  subject?: string;
  score?: number;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .flatMap((n) => (n ? [n[0]] : []))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function relativeTime(dateStr: string | undefined): string {
  if (!dateStr) return "Never";
  const d = new Date(dateStr);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

export async function getParentStudents(parentId: string): Promise<ParentStudent[]> {
  await auth();
  const relationships = await listDocuments(COLLECTIONS.PARENT_STUDENTS, [
    Query.equal("parentId", parentId),
    Query.equal("consentStatus", "granted"),
  ]);
  if (relationships.length === 0) return [];

  const studentIds = relationships.map((r) => (r as Record<string, unknown>).studentId as string);

  const usersApi = new Users(serverClient);
  const students = await Promise.all(
    studentIds.map(async (sid) => {
      try {
        const u = await usersApi.get(sid);
        return {
          id: sid,
          name: u.name || "Unknown",
          initials: getInitials(u.name || "U"),
          grade: (u.prefs?.grade as string) || "Matric",
        };
      } catch (err) {
        logError("GetParentStudents", err);
        return {
          id: sid,
          name: "Unknown",
          initials: "U",
          grade: "Matric",
        };
      }
    }),
  );
  return students;
}

export async function getChildSubjectProgress(
  studentId: string,
  canViewProgress: boolean,
  canViewScores: boolean,
): Promise<ChildSubjectProgress[]> {
  if (!canViewProgress) return [];
  await auth();

  const [competencies, subjects, topics, sessions, _progressDocs] = await Promise.all([
    listDocuments(COLLECTIONS.COMPETENCIES, [Query.equal("userId", studentId)]),
    listDocuments(COLLECTIONS.SUBJECTS),
    listDocuments(COLLECTIONS.TOPICS),
    listDocuments(COLLECTIONS.STUDY_SESSIONS, [Query.equal("userId", studentId)]),
    listDocuments(COLLECTIONS.USER_PROGRESS, [Query.equal("userId", studentId)]),
  ]);
  const subjectNames = new Map(
    subjects.map((s) => [
      (s as Record<string, unknown>).$id as string,
      (s as Record<string, unknown>).name as string,
    ]),
  );
  const topicCountBySubject = new Map<string, number>();
  for (const t of topics) {
    const doc = t as Record<string, unknown>;
    const sid = doc.subjectId as string;
    topicCountBySubject.set(sid, (topicCountBySubject.get(sid) || 0) + 1);
  }

  const sessionsBySubject = new Map<string, { count: number; lastDate: string }>();
  for (const s of sessions) {
    const doc = s as Record<string, unknown>;
    const sid = (doc.subjectId as string) || "unknown";
    const entry = sessionsBySubject.get(sid) || { count: 0, lastDate: "" };
    entry.count++;
    const ended = doc.endedAt as string | undefined;
    if (ended && ended > entry.lastDate) entry.lastDate = ended;
    sessionsBySubject.set(sid, entry);
  }

  const compBySubject = new Map<string, number[]>();
  for (const c of competencies) {
    const doc = c as Record<string, unknown>;
    const sid = (doc.subjectId as string) || "unknown";
    const score = (doc.proficiency as number) || 0;
    if (!compBySubject.has(sid)) compBySubject.set(sid, []);
    compBySubject.get(sid)?.push(score);
  }

  const results: ChildSubjectProgress[] = [];
  for (const [subjectId, scores] of compBySubject) {
    const subjectName = subjectNames.get(subjectId) || subjectId;
    const avgScore = canViewScores
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const sessionInfo = sessionsBySubject.get(subjectId);
    results.push({
      subject: subjectName,
      score: avgScore,
      topicsStudied: scores.length,
      totalTopics: topicCountBySubject.get(subjectId) || scores.length,
      lastStudied: relativeTime(sessionInfo?.lastDate),
    });
  }

  return results.sort((a, b) => b.score - a.score);
}

export async function getChildActivityTimeline(
  studentId: string,
  limit = 20,
): Promise<ActivityItem[]> {
  await auth();
  const sessions = await listDocuments(COLLECTIONS.STUDY_SESSIONS, [
    Query.equal("userId", studentId),
    Query.orderDesc("endedAt"),
    Query.limit(limit),
  ]);

  const items: ActivityItem[] = [];
  for (const s of sessions) {
    const doc = s as Record<string, unknown>;
    const qa = (doc.questionsAnswered as number) || 0;
    const cc = (doc.correctCount as number) || 0;
    const subject = (doc.subjectId as string) || "";
    const ended = doc.endedAt as string | undefined;
    items.push({
      id: doc.$id as string,
      type: "quiz",
      description: `Answered ${qa} questions (${Math.round(qa > 0 ? (cc / qa) * 100 : 0)}% correct)`,
      timestamp: relativeTime(ended),
      subject,
      score: qa > 0 ? Math.round((cc / qa) * 100) : undefined,
    });
  }

  return items;
}

export async function grantParentConsent(
  parentId: string,
  studentId: string,
  canViewProgress = true,
  canViewScores = true,
): Promise<void> {
  await auth();
  const existing = await listDocuments(COLLECTIONS.PARENT_STUDENTS, [
    Query.equal("parentId", parentId),
    Query.equal("studentId", studentId),
    Query.limit(1),
  ]);

  if (existing.length > 0) {
    await updateDocument(
      COLLECTIONS.PARENT_STUDENTS,
      (existing[0] as Record<string, unknown>).$id as string,
      {
        consentStatus: "granted",
        canViewProgress,
        canViewScores,
      },
    );
  } else {
    await createDocument(COLLECTIONS.PARENT_STUDENTS, {
      parentId,
      studentId,
      consentStatus: "granted",
      canViewProgress,
      canViewScores,
    });
  }
}

export async function revokeParentConsent(parentId: string, studentId: string): Promise<void> {
  await auth();
  const existing = await listDocuments(COLLECTIONS.PARENT_STUDENTS, [
    Query.equal("parentId", parentId),
    Query.equal("studentId", studentId),
    Query.limit(1),
  ]);
  if (existing.length > 0) {
    await updateDocument(
      COLLECTIONS.PARENT_STUDENTS,
      (existing[0] as Record<string, unknown>).$id as string,
      { consentStatus: "revoked" },
    );
  }
}

export async function getParentConsentStatus(
  parentId: string,
  studentId: string,
): Promise<"pending" | "granted" | "revoked"> {
  await auth();
  const existing = await listDocuments(COLLECTIONS.PARENT_STUDENTS, [
    Query.equal("parentId", parentId),
    Query.equal("studentId", studentId),
    Query.limit(1),
  ]);
  if (existing.length === 0) return "pending";
  return (existing[0] as Record<string, unknown>).consentStatus as
    | "pending"
    | "granted"
    | "revoked";
}
