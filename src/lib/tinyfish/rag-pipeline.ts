import { Effect } from "effect";
import { getDataSharingConsent } from "@/lib/consent/ai-gate";
import { logError } from "@/lib/shared/logger";
import {
  DEFAULT_FETCH_MAX_CHARS,
  DEFAULT_SEARCH_RESULTS,
  GENERATE_CACHE_TTL_MS,
  isDomainBlocked,
  isSubjectAllowed,
  PER_USER_DAILY_LIMIT,
  SOLVE_CACHE_TTL_MS,
} from "./allowlist";
import {
  buildGenerateKey,
  buildSolveKey,
  emptyRagContext,
  getCached,
  getTodayUsageCount,
  incrementTodayUsage,
  setCached,
} from "./cache";
import { isTinyFishConfigured, TinyFishError, tinyfishFetch, tinyfishSearch } from "./client";
import { deduped } from "./in-flight";
import type { RagContext, WebSource } from "./types";
import { buildRagContext, extractSourceFromFetchResult } from "./wrap";

export interface RagOptions {
  subject: string;
  topic: string;
  userId?: string;
}

export interface SourceOptions {
  question: string;
  userId?: string;
}

export async function searchWithRAG({ subject, topic, userId }: RagOptions): Promise<RagContext> {
  return runPipeline({
    guards: [
      () => isSubjectAllowed(subject),
      () => getDataSharingConsent(),
      () => isTinyFishConfigured(),
      () => topic.trim().length > 0,
      async () => {
        if (!userId) return true;
        const used = await getTodayUsageCount(userId);
        return used < PER_USER_DAILY_LIMIT;
      },
    ],
    buildKey: () => buildGenerateKey(subject, topic),
    cacheTtl: GENERATE_CACHE_TTL_MS,
    userId,
    fetchFn: () => fetchRagForTopic(subject, topic),
  });
}

export async function getSourceForQuestion({
  question,
  userId,
}: SourceOptions): Promise<RagContext> {
  return runPipeline({
    guards: [
      () => getDataSharingConsent(),
      () => isTinyFishConfigured(),
      () => question.trim().split(/\s+/).length >= 5,
      async () => {
        if (!userId) return true;
        const used = await getTodayUsageCount(userId);
        return used < PER_USER_DAILY_LIMIT;
      },
    ],
    buildKey: () => buildSolveKey(question),
    cacheTtl: SOLVE_CACHE_TTL_MS,
    userId,
    fetchFn: () => fetchSourceForQuestion(question),
  });
}

async function runPipeline(opts: {
  guards: (() => boolean | Promise<boolean>)[];
  buildKey: () => string;
  cacheTtl: number;
  userId?: string;
  fetchFn: () => Promise<RagContext>;
}): Promise<RagContext> {
  const { guards, buildKey, cacheTtl, userId, fetchFn } = opts;
  return Effect.runPromise(
    Effect.gen(function* () {
      for (const guard of guards) {
        const passed = yield* Effect.tryPromise({
          try: async () => await guard(),
          catch: () => false as boolean,
        });
        if (!passed) return emptyRagContext();
      }

      const key = buildKey();
      const cached = yield* Effect.tryPromise(() => getCached(key)).pipe(
        Effect.catchAll(() => Effect.succeed(null)),
      );
      if (cached) return cached;

      const fetched = yield* Effect.tryPromise(() => deduped(key, fetchFn)).pipe(
        Effect.catchAll(() => Effect.succeed(emptyRagContext())),
      );

      if (fetched.sources.length > 0) {
        yield* Effect.tryPromise(() => setCached(key, fetched, cacheTtl)).pipe(
          Effect.catchAll(() => Effect.void),
        );
      }

      if (userId) {
        yield* Effect.tryPromise(() => incrementTodayUsage(userId)).pipe(
          Effect.catchAll(() => Effect.void),
        );
      }

      return fetched;
    }).pipe(Effect.catchAll(() => Effect.succeed(emptyRagContext()))),
  );
}

async function fetchRagForTopic(subject: string, topic: string): Promise<RagContext> {
  try {
    const search = await tinyfishSearch(`${subject} ${topic} CAPS curriculum`, {
      location: "ZA",
      language: "en",
      numResults: DEFAULT_SEARCH_RESULTS,
    });

    const allowed = search.results
      .filter((r) => !isDomainBlocked(r.url))
      .slice(0, DEFAULT_SEARCH_RESULTS);

    if (allowed.length === 0) return emptyRagContext();

    const urls = allowed.map((r) => r.url);
    const fetched = await tinyfishFetch(urls, {
      format: "markdown",
      maxCharacters: DEFAULT_FETCH_MAX_CHARS,
    });

    const sources: WebSource[] = fetched.results.map(extractSourceFromFetchResult);
    return buildRagContext(sources);
  } catch (err) {
    logError("TinyFishIndex", err);
    if (err instanceof TinyFishError) {
      console.warn(`[tinyfish] RAG fetch failed: ${err.message}`);
    }
    return emptyRagContext();
  }
}

async function fetchSourceForQuestion(question: string): Promise<RagContext> {
  try {
    const search = await tinyfishSearch(`${question} site:education.gov.za`, {
      location: "ZA",
      language: "en",
      numResults: 1,
    });

    const first = search.results.find((r) => !isDomainBlocked(r.url));
    if (!first) return emptyRagContext();

    const fetched = await tinyfishFetch([first.url], {
      format: "markdown",
      maxCharacters: DEFAULT_FETCH_MAX_CHARS,
    });

    const firstResult = fetched.results[0];
    if (!firstResult) return emptyRagContext();

    const source = extractSourceFromFetchResult(firstResult);
    return buildRagContext([source]);
  } catch (err) {
    logError("TinyFishIndex", err);
    if (err instanceof TinyFishError) {
      console.warn(`[tinyfish] source fetch failed: ${err.message}`);
    }
    return emptyRagContext();
  }
}
