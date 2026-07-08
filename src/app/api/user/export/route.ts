import { type NextRequest, NextResponse } from "next/server";
import { Query } from "node-appwrite";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const INTERNAL_KEYS = new Set(["$id", "$collectionId", "$permissions"]);

function stripInternals(doc: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(doc)) {
    if (!INTERNAL_KEYS.has(k)) clean[k] = v;
  }
  return clean;
}

const EXPORT_COLLECTIONS = [
  COLLECTIONS.USER_SUBJECTS,
  COLLECTIONS.USER_PROGRESS,
  COLLECTIONS.STUDY_SESSIONS,
  COLLECTIONS.COMPETENCIES,
  COLLECTIONS.EXAM_SESSIONS,
  COLLECTIONS.FLASHCARDS,
  COLLECTIONS.WRONG_ANSWERS,
  COLLECTIONS.CHAT_MESSAGES,
  COLLECTIONS.BOOKMARKS,
  COLLECTIONS.NOTES,
  COLLECTIONS.USER_GAMIFICATION,
  COLLECTIONS.USER_CONSENTS,
];

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  return response;
}

async function exportHandler(_req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await auth();

    const entries = await Promise.all(
      EXPORT_COLLECTIONS.map(async (col) => {
        try {
          const docs = await listDocuments<Record<string, unknown>>(col, [
            Query.equal("userId", userId),
          ]);
          return [col, docs.map(stripInternals)] as const;
        } catch {
          return [col, []] as const;
        }
      }),
    );

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      collections: Object.fromEntries(entries),
    };

    return addSecurityHeaders(
      new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="lumni-export-${new Date().toISOString().split("T")[0]}.json"`,
        },
      }),
    );
  } catch (error) {
    logError("UserExport", error);
    return addSecurityHeaders(
      NextResponse.json({ error: "Failed to export data" }, { status: 500 }),
    );
  }
}

export const GET = withRateLimit(exportHandler);
