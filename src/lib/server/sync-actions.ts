"use server";

import { Query } from "appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

function getAllSubjects(): string[] {
  return [
    "mathematics",
    "physical-sciences",
    "life-sciences",
    "accounting",
    "business-studies",
    "economics",
    "geography",
    "history",
  ];
}

export async function syncSubject(subject: string): Promise<{
  success: boolean;
  synced: number;
  local: number;
  version: string;
  error?: string;
}> {
  const userId = await auth();
  if (!userId)
    return {
      success: false,
      synced: 0,
      local: 0,
      version: "v2",
      error: "Authentication required",
    };
  try {
    const subjectId = subject.toLowerCase().replace(/\s+/g, "-");
    const subjects = await listDocuments<Record<string, unknown>>(COLLECTIONS.SUBJECTS, [
      Query.equal("code", subjectId),
      Query.limit(1),
    ]);

    const version = subjects.length > 0 ? (subjects[0].sourceVersion as string) || "v1" : "v1";

    return {
      success: true,
      synced: 0,
      local: 0,
      version,
    };
  } catch (error) {
    logError("SyncSubject", error);
    return {
      success: false,
      synced: 0,
      local: 0,
      version: "v2",
      error: error instanceof Error ? error.message : "Sync failed",
    };
  }
}

export async function syncAllSubjects(): Promise<{
  results: {
    subject: string;
    success: boolean;
    synced: number;
    local: number;
    version: string;
    error?: string;
  }[];
}> {
  const userId = await auth();
  if (!userId) {
    return { results: [] };
  }
  const results = await Promise.all(
    getAllSubjects().map(async (subject) => {
      const result = await syncSubject(subject);
      return { subject, ...result };
    }),
  );
  return { results };
}

export async function checkSubjectStatus(subject: string): Promise<{
  exists: boolean;
  localQuestions: number;
  version: string | null;
  needsSync: boolean;
}> {
  const userId = await auth();
  if (!userId)
    return {
      exists: false,
      localQuestions: 0,
      version: null,
      needsSync: false,
    };
  return checkSubjectStatusInternal(subject);
}

async function checkSubjectStatusInternal(subject: string): Promise<{
  exists: boolean;
  localQuestions: number;
  version: string | null;
  needsSync: boolean;
}> {
  try {
    const subjectId = subject.toLowerCase().replace(/\s+/g, "-");
    const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
      Query.equal("code", subjectId),
      Query.limit(1),
    ]);

    if (subjects.length === 0) {
      return {
        exists: false,
        localQuestions: 0,
        version: null,
        needsSync: true,
      };
    }

    const version = ((subjects[0] as Record<string, unknown>).sourceVersion as string) || null;
    const needsSync = !version;

    const questions = await listDocuments(COLLECTIONS.QUESTIONS, [
      Query.equal("subject", subject),
      Query.limit(1),
    ]);

    const count = Array.isArray(questions) ? questions.length : 0;
    return {
      exists: true,
      localQuestions: count,
      version,
      needsSync,
    };
  } catch (err) {
    logError("CheckSubjectStatusInternal", err);
    return { exists: false, localQuestions: 0, version: null, needsSync: true };
  }
}

export async function refreshSubject(subject: string): Promise<{
  success: boolean;
  synced: number;
  local: number;
  version: string;
  isFresh: boolean;
  error?: string;
}> {
  const userId = await auth();
  if (!userId)
    return {
      success: false,
      synced: 0,
      local: 0,
      version: "v2",
      isFresh: false,
      error: "Authentication required",
    };
  const result = await syncSubject(subject);
  return {
    success: result.success,
    synced: result.synced,
    local: result.local,
    version: result.version,
    isFresh: true,
    error: result.error,
  };
}
