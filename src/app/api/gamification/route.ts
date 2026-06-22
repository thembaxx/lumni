import { Client, Databases, ID, Query } from "appwrite";
import { z } from "zod";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { getAuthenticatedUserName } from "@/lib/server/auth";

const GamificationUpdateSchema = z
  .strictObject({
    totalXp: z.number().optional(),
    currentStreak: z.number().optional(),
    longestStreak: z.number().optional(),
    lastActiveDate: z.string().optional(),
    totalQuestionsAnswered: z.number().optional(),
    totalQuizScore: z.number().optional(),
    totalQuizzesTaken: z.number().optional(),
    achievements: z.array(z.string()).optional(),
    streakFreezes: z.number().optional(),
  })
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "At least one field must be provided",
  });

export const GET = createRouteHandler({
  auth: "optional",
  errorLabel: "Gamification",
  execute: async ({ userId }) => {
    if (!userId) return { gamification: null };

    const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
    const db = new Databases(client);

    try {
      const docs = await db.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USER_GAMIFICATION, [
        Query.equal("userId", userId),
        Query.limit(1),
      ]);
      const record = docs.documents[0] ?? null;
      if (record) {
        const {
          userId: _u,
          $id: _$id,
          $collectionId: _$collectionId,
          $createdAt: _$createdAt,
          $updatedAt: _$updatedAt,
          $permissions: _$permissions,
          $databaseId: _$databaseId,
          ...rest
        } = record;
        return { gamification: rest };
      }
      return { gamification: null };
    } catch {
      return { gamification: null };
    }
  },
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "Gamification",
  execute: async ({ userId, body }) => {
    const userName = await getAuthenticatedUserName();
    const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
    const db = new Databases(client);

    let parsed: z.infer<typeof GamificationUpdateSchema>;
    try {
      parsed = GamificationUpdateSchema.parse(body);
    } catch {
      throw new HttpError(400, "Invalid gamification data");
    }
    const payload = {
      ...parsed,
      userId,
      label: userName ?? undefined,
    };

    try {
      const docs = await db.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USER_GAMIFICATION, [
        Query.equal("userId", userId as string),
        Query.limit(1),
      ]);

      if (docs.documents.length > 0) {
        await db.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.USER_GAMIFICATION,
          docs.documents[0].$id,
          payload,
        );
      } else {
        await db.createDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.USER_GAMIFICATION,
          ID.unique(),
          payload,
        );
      }
      return { success: true };
    } catch {
      throw new HttpError(500, "Failed to sync");
    }
  },
});
