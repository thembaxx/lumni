import { Effect } from "effect";
import type { AIClient } from "@/lib/ai/client";
import type {
  DataAccess,
  CacheDataAccess,
  LessonDataAccess,
  StoryDataAccess,
  StudyDataAccess,
} from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";

export type CachedAIGeneratorDb =
  | CacheDataAccess
  | LessonDataAccess
  | StoryDataAccess
  | StudyDataAccess;

export interface CachedAIGeneratorConfig<T, TDb extends CachedAIGeneratorDb = DataAccess> {
  systemPrompt: string;
  ttlMs: number;
  buildPrompt: (subject: string, topic: string) => string;
  parseResponse: (content: string) => T;
  emptyResult: T;
  isEmpty: (result: T) => boolean;
  getTable: (db: TDb) => {
    get: (key: string) => Promise<{ expiresAt: number } | undefined>;
    put: (entry: unknown) => Promise<unknown>;
  };
  buildCacheEntry: (key: string, data: T, ttlMs: number, subject: string, topic: string) => unknown;
  extractData: (cached: unknown) => T;
  buildCacheKey: (subject: string, topic: string) => string;
  errorLabel: string;
}

export class CachedAIGenerator<T, TDb extends CachedAIGeneratorDb = DataAccess> {
  constructor(
    private readonly config: CachedAIGeneratorConfig<T, TDb>,
    private readonly ai: AIClient,
    private readonly db: TDb,
  ) {}

  generateEffect(subject: string, topic: string): Effect.Effect<T> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const prompt = self.config.buildPrompt(subject, topic);
      const result = yield* Effect.tryPromise(() =>
        self.ai.generateWithSystem(self.config.systemPrompt, prompt),
      ).pipe(Effect.catchAll(() => Effect.succeed(null)));
      if (!result || !("content" in result) || !result.content) {
        return self.config.emptyResult;
      }
      const parsed = yield* Effect.try(() => self.config.parseResponse(result.content)).pipe(
        Effect.catchAll((err) => {
          logError(self.config.errorLabel, err);
          return Effect.succeed(self.config.emptyResult);
        }),
      );
      return parsed;
    });
  }

  async generate(subject: string, topic: string): Promise<T> {
    return Effect.runPromise(this.generateEffect(subject, topic));
  }

  getCachedEffect(subject: string, topic: string): Effect.Effect<T | null> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const key = self.config.buildCacheKey(subject, topic);
      const table = self.config.getTable(self.db);
      const cached = yield* Effect.tryPromise(() => table.get(key)).pipe(
        Effect.catchAll(() => Effect.void),
      );
      if (cached && cached.expiresAt > Date.now()) {
        return self.config.extractData(cached);
      }
      return null;
    });
  }

  async getCached(subject: string, topic: string): Promise<T | null> {
    return Effect.runPromise(this.getCachedEffect(subject, topic));
  }

  storeEffect(subject: string, topic: string, data: T): Effect.Effect<void> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const key = self.config.buildCacheKey(subject, topic);
      const table = self.config.getTable(self.db);
      const entry = self.config.buildCacheEntry(key, data, self.config.ttlMs, subject, topic);
      yield* Effect.tryPromise(() => table.put(entry)).pipe(Effect.catchAll(() => Effect.void));
    });
  }

  async store(subject: string, topic: string, data: T): Promise<void> {
    return Effect.runPromise(this.storeEffect(subject, topic, data));
  }

  fetchWithCacheEffect(subject: string, topic: string): Effect.Effect<T> {
    // oxlint-disable-next-line typescript/no-this-alias
    const self = this;
    return Effect.gen(function* () {
      const cached = yield* self.getCachedEffect(subject, topic);
      if (cached) return cached;

      const result = yield* self.generateEffect(subject, topic);
      if (!self.config.isEmpty(result)) {
        yield* self.storeEffect(subject, topic, result);
      }
      return result;
    });
  }

  async fetchWithCache(subject: string, topic: string): Promise<T> {
    return Effect.runPromise(this.fetchWithCacheEffect(subject, topic));
  }
}
