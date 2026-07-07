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
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("RAG fetch timeout")), RAG_TIMEOUT_MS);
    });
    const result = await Promise.race([
      fetch({ subject, topic, userId: userId ?? undefined }),
      timeout,
    ]);
    clearTimeout(timer!);
    return result;
  } catch (err) {
    logError("FetchRagContext", err);
    return emptyRagContext();
  }
}
