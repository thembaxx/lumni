"use server";

import { randomUUID } from "node:crypto";
import { Query } from "appwrite";
import { UTApi, UTFile } from "uploadthing/server";
import type { Subject, UserSubject } from "@/lib/db/client";
import {
  COLLECTIONS,
  createDocument,
  deleteDocument,
  listDocuments,
  updateDocument,
} from "@/lib/db/client";
import { auth, requireAdmin, verifyAuth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";

function mapSubject(s: Subject) {
  return { ...s, id: sanitizeSubjectId(s.code || s.$id) };
}

function sanitizeUserId(userId: string): string {
  if (!userId || typeof userId !== "string") {
    throw new Error("Invalid user ID");
  }
  const trimmed = userId.trim();
  if (trimmed.length === 0) {
    throw new Error("Invalid user ID");
  }
  if (trimmed.length > 128) {
    throw new Error("Invalid user ID");
  }
  if (/[/\\<>:"|?*]/.test(trimmed) || /[^\x20-\x7E]/.test(trimmed)) {
    throw new Error("Invalid user ID format");
  }
  return trimmed;
}

function sanitizeSubjectId(subjectId: string): string {
  if (!subjectId || typeof subjectId !== "string") {
    throw new Error("Invalid subject ID");
  }
  const trimmed = subjectId.trim();
  if (trimmed.length === 0) {
    throw new Error("Invalid subject ID");
  }
  if (trimmed.length > 128) {
    throw new Error("Invalid subject ID");
  }
  if (/[/\\<>:"|?*]/.test(trimmed) || /[^\x20-\x7E]/.test(trimmed)) {
    throw new Error("Invalid subject ID format");
  }
  return trimmed;
}

export async function fetchSubjects(userId: string) {
  await verifyAuth(userId);

  const sanitizedUserId = sanitizeUserId(userId);

  const [subjectDocs, userSubjectDocs] = await Promise.all([
    listDocuments<Subject>(COLLECTIONS.SUBJECTS),
    listDocuments<UserSubject>(COLLECTIONS.USER_SUBJECTS, [Query.equal("userId", sanitizedUserId)]),
  ]);

  const selectedIds = userSubjectDocs.map((us) => sanitizeSubjectId(us.subjectId));

  return {
    subjects: subjectDocs.map(mapSubject),
    selectedSubjectIds: selectedIds,
  };
}

export async function fetchUserProgress(userId: string) {
  try {
    await verifyAuth(userId);
  } catch {
    return { questionsAnswered: 0, accuracy: 0, streak: 0 };
  }
  const targetUserId = userId;
  const sanitizedUserId = sanitizeUserId(targetUserId);

  const [progressArr, sessions] = await Promise.all([
    listDocuments(COLLECTIONS.USER_PROGRESS, [
      Query.equal("userId", sanitizedUserId),
      Query.limit(1),
    ]),
    listDocuments(COLLECTIONS.STUDY_SESSIONS, [Query.equal("userId", sanitizedUserId)]),
  ]);

  const progress = progressArr[0] || null;

  const totalAnswered = sessions.reduce(
    (sum: number, s) => sum + ((s as Record<string, unknown>).questionsAnswered as number) || 0,
    0,
  );
  const totalCorrect = sessions.reduce(
    (sum: number, s) => sum + ((s as Record<string, unknown>).correctCount as number) || 0,
    0,
  );
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  return {
    questionsAnswered: totalAnswered,
    accuracy,
    streak: progress ? ((progress as Record<string, unknown>).currentStreak as number) : 0,
  };
}

export async function toggleUserSubject(userId: string, subjectId: string) {
  await verifyAuth(userId);
  const sanitizedUserId = sanitizeUserId(userId);
  const sanitizedSubjectId = sanitizeSubjectId(subjectId);
  const existing = await listDocuments(COLLECTIONS.USER_SUBJECTS, [
    Query.equal("userId", sanitizedUserId),
    Query.equal("subjectId", sanitizedSubjectId),
    Query.limit(1),
  ]);

  if (existing.length > 0) {
    await deleteDocument(
      COLLECTIONS.USER_SUBJECTS,
      (existing[0] as Record<string, unknown>).$id as string,
    );
    return false;
  } else {
    await createDocument(COLLECTIONS.USER_SUBJECTS, {
      userId: sanitizedUserId,
      subjectId: sanitizedSubjectId,
    });
    return true;
  }
}

export async function adminUploadExamPaper(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  const file = formData.get("file") as File | null;
  const subjectId = formData.get("subjectId") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const paperNumber = parseInt(formData.get("paperNumber") as string, 10);
  const type = formData.get("type") as "paper" | "memo";

  if (!file || !subjectId || !year || !paperNumber || !type) {
    return { success: false, error: "Missing required fields" };
  }

  await auth();
  await requireAdmin();
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const utFile = new UTFile([buffer], file.name);

    const utapi = new UTApi();
    const result = await utapi.uploadFiles(utFile);

    if (!result?.data) {
      return {
        success: false,
        error: result?.error?.message || "Upload failed",
      };
    }

    const fileUrl = result.data.ufsUrl;
    const fileKey = result.data.key;
    const id = randomUUID();

    await createDocument(COLLECTIONS.EXAM_PAPERS, {
      subjectId,
      year,
      paperNumber,
      type,
      fileUrl,
      fileKey,
      originalFileName: file.name,
    });

    if (type === "memo") {
      const questionPaper = await listDocuments(COLLECTIONS.EXAM_PAPERS, [
        Query.equal("subjectId", subjectId),
        Query.equal("year", year),
        Query.equal("paperNumber", paperNumber),
        Query.equal("type", "paper"),
        Query.limit(1),
      ]);

      if (questionPaper.length > 0) {
        await updateDocument(
          COLLECTIONS.EXAM_PAPERS,
          (questionPaper[0] as Record<string, unknown>).$id as string,
          {
            memoId: id,
          },
        );
      }
    }

    return { success: true, url: fileUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getUserAccounts(_userId: string) {
  await auth();
  await requireAdmin();
  try {
    const { Users } = await import("node-appwrite");
    const { serverClient } = await import("@/lib/appwrite.server");
    const usersApi = new Users(serverClient);
    const response = await usersApi.list();
    return response.users.map((u) => ({
      id: u.$id,
      name: u.name,
      email: u.email,
      emailVerification: u.emailVerification,
      labels: u.labels,
      createdAt: u.$createdAt,
    }));
  } catch (error) {
    logError("GetUserAccounts", error);
    return [];
  }
}
