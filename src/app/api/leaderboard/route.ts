import { Client, Databases, Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";
import { isSubjectAllowed } from "@/lib/tinyfish/allowlist";

async function fetchLeaderboard(subject?: string | null) {
  const client = new Client().setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT);
  const db = new Databases(client);

  const queries = [Query.orderDesc("totalXp"), Query.limit(100)];

  if (subject && isSubjectAllowed(subject)) {
    queries.push(Query.equal("subjects", subject));
  }

  return db.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.USER_GAMIFICATION, queries);
}

export const GET = createRouteHandler({
  auth: "optional",
  errorLabel: "Leaderboard",
  execute: async ({ params, userId }: { params?: Record<string, string>; userId: string | null }) => {
    const subject = params?.subject;
    try {
      const docs = await fetchLeaderboard(subject);

      const entries = docs.documents.map((doc, index) => ({
        rank: index + 1,
        userId: doc.userId as string,
        label: (doc.label as string) || `Student ${index + 1}`,
        xp: (doc.totalXp as number) || 0,
        streak: (doc.currentStreak as number) || 0,
        level: (doc.level as number) || 1,
        subject,
      }));

      return { entries, total: entries.length, authenticated: !!userId };
    } catch (err) {
      logError("Leaderboard", err);
      return { entries: [], total: 0, authenticated: false };
    }
  },
});
