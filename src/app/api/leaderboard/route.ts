import { Client, Databases, Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const GET = createRouteHandler({
  auth: "none",
  errorLabel: "Leaderboard",
  execute: async () => {
    const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
    const db = new Databases(client);

    try {
      const docs = await db.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USER_GAMIFICATION, [
        Query.orderDesc("totalXp"),
        Query.limit(100),
      ]);

      const entries = docs.documents.map((doc, index) => ({
        rank: index + 1,
        userId: doc.userId as string,
        label: (doc.label as string) || `Student ${index + 1}`,
        xp: (doc.totalXp as number) || 0,
        streak: (doc.currentStreak as number) || 0,
        level: (doc.level as number) || 1,
      }));

      return { entries };
    } catch (err) {
      logError("Leaderboard", err);
      return { entries: [] };
    }
  },
});
