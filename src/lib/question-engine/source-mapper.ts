import type { Question, QuestionSource } from "./types";

type RawQuestion = Question & { sourceRefs?: unknown };

type SourceLike = { url?: unknown; title?: unknown };

/**
 * Validate a `sourceRefs: number[]` payload from the AI and map it to
 * a list of `{ url, title }` references. Returns `undefined` if the
 * payload is missing, not an array, contains non-integers, or contains
 * indices that don't exist in `sources`. Callers should treat
 * `undefined` as "fall back to attaching ALL sources".
 */
export function mapSourceRefs(
  raw: unknown,
  sources: ReadonlyArray<SourceLike>,
): QuestionSource[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  if (raw.length === 0) return [];

  const result: QuestionSource[] = [];
  for (const entry of raw) {
    if (typeof entry !== "number" || !Number.isInteger(entry)) return undefined;
    if (entry < 0 || entry >= sources.length) return undefined;
    const src = sources[entry];
    if (!src || typeof src.url !== "string" || typeof src.title !== "string") {
      return undefined;
    }
    result.push({ url: src.url, title: src.title });
  }
  return result;
}

/**
 * Attach a `webSources` field to a generated question based on the
 * batch's RAG context. Two strategies, in order:
 *
 * 1. **AI-cited**: if the question carried a `sourceRefs` payload, map it
 *    via `mapSourceRefs`. If mapping succeeds (including an explicit
 *    empty array), use it. If mapping fails validation, fall through to
 *    strategy 2.
 * 2. **All sources fallback**: attach the full batch `sources` list.
 *
 * Mutates the question in place and returns it. If `ragContext` has no
 * sources, the question is left untouched (no `webSources` field).
 */
export function attachWebSources(
  question: RawQuestion,
  ragContext: { sources: ReadonlyArray<SourceLike> } | undefined,
): Question {
  if (!ragContext || ragContext.sources.length === 0) {
    delete (question as { sourceRefs?: unknown }).sourceRefs;
    return question;
  }

  const mapped = mapSourceRefs(question.sourceRefs, ragContext.sources);
  if (mapped !== undefined) {
    question.webSources = mapped;
  } else {
    question.webSources = ragContext.sources.map((s) => ({
      url: String(s.url),
      title: String(s.title),
    }));
  }

  delete (question as { sourceRefs?: unknown }).sourceRefs;
  return question;
}
