import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { makeCacheKey } from "./visual-engine";
import { safeJsonParse, safeJsonStringify } from "@/lib/shared/json";
import { logError } from "@/lib/shared/logger";
import { syncManager } from "@/lib/sync/sync-manager";
import type { VisualContent } from "./types";

const COLLECTION_ID = COLLECTIONS.VISUALS;

export async function saveVisualToAppwrite(
  questionId: string,
  subject: string,
  visual: VisualContent | null,
): Promise<void> {
  syncManager.enqueue({
    type: "appwrite-visual-sync",
    payload: {
      questionId,
      subject,
      visual: safeJsonStringify(visual),
    },
  });
}

export async function loadVisualFromAppwrite(
  questionId: string,
  subject: string,
): Promise<VisualContent | null> {
  try {
    const { databases } = await import("@/lib/appwrite.server");
    const response = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTION_ID,
      makeCacheKey(questionId, subject),
    );

    if (!response) return null;

    const doc = response as Record<string, unknown>;
    const visual = safeJsonParse(doc.visual as string, null) as VisualContent | null;
    const expiresAt = doc.expiresAt as string;

    if (expiresAt && Date.now() > new Date(expiresAt).getTime()) {
      return null;
    }

    return visual;
  } catch (err) {
    logError("LoadVisualFromAppwrite", err);
    return null;
  }
}
