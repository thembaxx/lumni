import { createRouteHandler } from "@/lib/api/create-route-handler";
import { Query } from "appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

interface LiveResponse {
  liveUsers: number;
}

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "MetricsLive",
  execute: async (): Promise<LiveResponse> => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const recentSessions = await listDocuments<Record<string, unknown>>(
      COLLECTIONS.STUDY_SESSIONS,
      [Query.greaterThan("startedAt", fiveMinutesAgo)],
    );

    const liveUsers = new Set(recentSessions.map((s) => String(s.userId ?? "")).filter(Boolean))
      .size;

    return { liveUsers };
  },
});
