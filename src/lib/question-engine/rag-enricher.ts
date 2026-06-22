import { logError } from "@/lib/shared/logger";
import { type buildPromptInstruction, emptyRagContext, searchWithRAG } from "@/lib/tinyfish";

export interface RagDeps {
  searchWithRAG?: typeof searchWithRAG;
  buildPromptInstruction?: typeof buildPromptInstruction;
}

export const RAG_TIMEOUT_MS = 3000;

export async function fetchRagContext(
  subject: string,
  topic: string | undefined,
  userId: string | null | undefined,
  deps?: RagDeps,
): Promise<ReturnType<typeof emptyRagContext>> {
  const fetch = deps?.searchWithRAG ?? searchWithRAG;
  if (!subject || !topic?.trim()) return emptyRagContext();

  try {
    const result = await Promise.race([
      fetch({ subject, topic, userId: userId ?? undefined }),
      new Promise<ReturnType<typeof emptyRagContext>>((_, reject) =>
        setTimeout(() => reject(new Error("RAG fetch timeout")), RAG_TIMEOUT_MS),
      ),
    ]);
    return result;
  } catch (err) {
    logError("FetchRagContext", err);
    console.warn(
      `[question-engine] web source fetch failed, continuing without grounding: ${
        err instanceof Error ? err.message : String(err)
      }`,
    );
    return emptyRagContext();
  }
}
