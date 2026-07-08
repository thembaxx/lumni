import { Query } from "appwrite";
import { customAlphabet } from "nanoid";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { isTeacher } from "@/lib/server/auth";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS, listDocuments } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;
const generateCode = customAlphabet(ALPHABET, CODE_LENGTH);

async function generateUniqueCode(maxAttempts = 3): Promise<string | null> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateCode();
    const existing = await listDocuments(COLLECTIONS.CLASSROOM_CODES, [
      Query.equal("code", code),
      Query.limit(1),
    ]);
    if (existing.length === 0) return code;
  }
  return null;
}

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ClassroomCodeCreate",
  validate: (body) => {
    if (body.subjectId && typeof body.subjectId !== "string") return "subjectId must be a string";
    if (body.maxUses !== undefined && (typeof body.maxUses !== "number" || body.maxUses < 1))
      return "maxUses must be a positive number";
    if (
      body.expiresInDays !== undefined &&
      (typeof body.expiresInDays !== "number" || body.expiresInDays < 1)
    )
      return "expiresInDays must be a positive number";
    return null;
  },
  execute: async ({ userId, body }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const { subjectId, label, maxUses, expiresInDays } = body as {
      subjectId?: string;
      label?: string;
      maxUses?: number;
      expiresInDays?: number;
    };

    const code = await generateUniqueCode();
    if (!code) {
      return { error: "Failed to generate unique code. Try again." };
    }

    const expiresAt = Date.now() + (expiresInDays ?? 7) * 24 * 60 * 60 * 1000;

    try {
      await databases.createDocument(APPWRITE_DATABASE_ID, COLLECTIONS.CLASSROOM_CODES, code, {
        code,
        teacherId: userId,
        subjectId: subjectId || null,
        label: label || null,
        expiresAt,
        maxUses: maxUses || null,
        useCount: 0,
        createdAt: Date.now(),
        revoked: false,
      });
    } catch (e) {
      logError("ClassroomCodeCreateDB", e);
      return { error: "Failed to save classroom code" };
    }

    return {
      code,
      label: label || null,
      expiresAt,
      url: `/join/${code}`,
    };
  },
});

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "ClassroomCodeList",
  execute: async ({ userId }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const now = Date.now();
    const docs = await listDocuments(COLLECTIONS.CLASSROOM_CODES, [
      Query.equal("teacherId", userId as string),
      Query.equal("revoked", false),
    ]);

    const codes = docs
      .filter((d) => {
        const doc = d as Record<string, unknown>;
        return (doc.expiresAt as number) > now;
      })
      .map((d) => {
        const doc = d as Record<string, unknown>;
        return {
          code: doc.code as string,
          label: doc.label as string | null,
          subjectId: doc.subjectId as string | null,
          expiresAt: doc.expiresAt as number,
          useCount: doc.useCount as number,
          maxUses: doc.maxUses as number | null,
          createdAt: doc.createdAt as number,
        };
      });

    return { codes };
  },
});

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "ClassroomCodeDelete",
  validate: (body) => {
    if (!body.code) return "code required";
    return null;
  },
  execute: async ({ userId, body }) => {
    if (!userId || !isTeacher(userId)) throw new HttpError(403, "Teacher access required");
    const { code } = body as { code: string };

    try {
      const docs = await listDocuments(COLLECTIONS.CLASSROOM_CODES, [
        Query.equal("code", code),
        Query.equal("teacherId", userId as string),
        Query.limit(1),
      ]);

      if (docs.length === 0) {
        return { success: false, error: "Code not found" };
      }

      const doc = docs[0] as Record<string, unknown>;
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.CLASSROOM_CODES,
        doc.$id as string,
        {
          revoked: true,
        },
      );

      return { success: true, code, revoked: true };
    } catch (e) {
      logError("ClassroomCodeDelete", e);
      return { success: false, error: "Failed to revoke code" };
    }
  },
});
