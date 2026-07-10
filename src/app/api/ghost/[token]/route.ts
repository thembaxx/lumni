import { Query } from "appwrite";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";

interface GhostLink {
  token: string;
  teacherId: string;
  createdAt: number;
  expiresAt: number;
  revoked: boolean;
}

export const GET = createRouteHandler({
  auth: "none",
  execute: async ({ params }) => {
    const token = params?.token;

    if (!token || typeof token !== "string") {
      throw new HttpError(400, "Invalid token");
    }

    let link: GhostLink | null = null;

    try {
      const docs = await databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.GHOST_LINKS, [
        Query.equal("token", token),
        Query.limit(1),
      ]);
      if (docs.documents.length > 0) {
        link = docs.documents[0] as unknown as GhostLink;
      }
    } catch (e) {
      logError("GhostTokenFetch", e);
      throw new HttpError(500, "Failed to verify token");
    }

    if (!link) {
      throw new HttpError(404, "Invalid or expired token");
    }
    if (link.revoked || link.expiresAt < Date.now()) {
      throw new HttpError(403, "Token expired or revoked");
    }

    return {
      totalStudents: 0,
      subjectEnrollments: {},
      avgScores: {},
      totalQuizAttempts: 0,
      completionRate: 0,
      lastUpdated: Date.now(),
    };
  },
  errorLabel: "GhostRoute",
});
