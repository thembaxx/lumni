import { beforeEach, describe, expect, test, vi } from "vitest";
import { safeJsonStringify } from "@/lib/shared/json";

// Mock store for all repositories
const stores: Record<string, Record<string, unknown>[]> = {
  cachedPdfs: [],
  examSessions: [],
  quizSessions: [],
  quizAttempts: [],
  visuals: [],
  questions: [],
  progress: [],
  conflicts: [],
  changeLog: [],
  competencyProgress: [],
  questionCache: [],
  visualCache: [],
};

// Helper to get store by table name
function getStore(tableName: string) {
  return stores[tableName];
}

// Mock module with full DataAccess-like API — MUST be before imports
vi.mock("@/lib/db", () => ({
  dexieDataAccess: buildMockDataAccess(),
}));

// Also mock schema for unmigrated repos that still use offlineDB directly
vi.mock("@/lib/db/schema", () => ({
  offlineDB: buildMockDataAccess(),
}));

function buildMockDataAccess() {
  return {
    cachedPdfs: createDexieTable("cachedPdfs"),
    examSessions: createDexieTable("examSessions"),
    quizSessions: createDexieTable("quizSessions"),
    quizAttempts: createQuizAttemptsTable(),
    visuals: createDexieTable("visuals"),
    questions: createDexieTable("questions"),
    progress: createDexieTable("progress"),
    conflicts: createDexieTable("conflicts"),
    changeLog: createDexieTable("changeLog"),
    competencyProgress: createDexieTable("competencyProgress"),
    questionCache: createDexieTable("questionCache"),
    visualCache: createDexieTable("visualCache"),
  };
}

// --- Inlined pdf-cache functions ---
async function cachePdf(paperId: string, pdfData: Blob, fileName: string): Promise<void> {
  const store = getStore("cachedPdfs") as Record<string, unknown>[];
  const existing = store.find((s) => s.paperId === paperId);
  const entry: Record<string, unknown> = { paperId, pdfData, fileName, cachedAt: Date.now() };
  if (existing?.id != null) Object.assign(existing, entry);
  else {
    entry.id = Date.now() + Math.random();
    store.push(entry);
  }
}

async function getCachedPdf(paperId: string): Promise<Record<string, unknown> | undefined> {
  return (getStore("cachedPdfs") as Record<string, unknown>[]).find((s) => s.paperId === paperId);
}

async function isPdfCached(paperId: string): Promise<boolean> {
  return !!(await getCachedPdf(paperId));
}

async function removeCachedPdf(paperId: string): Promise<void> {
  const store = getStore("cachedPdfs") as Record<string, unknown>[];
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].paperId === paperId) store.splice(i, 1);
  }
}

async function clearOldPdfCache(maxAgeHours: number): Promise<void> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const store = getStore("cachedPdfs") as Record<string, unknown>[];
  for (let i = store.length - 1; i >= 0; i--) {
    if ((store[i].cachedAt as number) < cutoff) store.splice(i, 1);
  }
}

// --- Inlined exam-session functions ---
async function saveExamSession(paperId: string, data: Record<string, unknown>): Promise<void> {
  const store = getStore("examSessions") as Record<string, unknown>[];
  const existing = store.find((s) => s.paperId === paperId);
  const entry: Record<string, unknown> = { ...data, paperId, lastSavedAt: Date.now() };
  if (existing?.id != null) Object.assign(existing, entry);
  else {
    entry.id = Date.now() + Math.random();
    store.push(entry);
  }
}

async function getExamSession(paperId: string): Promise<Record<string, unknown> | undefined> {
  return (getStore("examSessions") as Record<string, unknown>[]).find((s) => s.paperId === paperId);
}

async function clearExamSession(paperId: string): Promise<void> {
  const store = getStore("examSessions") as Record<string, unknown>[];
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].paperId === paperId) store.splice(i, 1);
  }
}

async function clearOldExamSessions(maxAgeHours: number): Promise<void> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const store = getStore("examSessions") as Record<string, unknown>[];
  for (let i = store.length - 1; i >= 0; i--) {
    if ((store[i].lastSavedAt as number) < cutoff) store.splice(i, 1);
  }
}

// --- Inlined quiz-session functions ---
const _qsStore = () => getStore("quizSessions") as Record<string, unknown>[];

async function saveQuizSession(data: Record<string, unknown>): Promise<void> {
  const store = _qsStore();
  const existing = data.sessionId ? store.find((s) => s.sessionId === data.sessionId) : undefined;
  const entry: Record<string, unknown> = { ...data, lastSavedAt: Date.now() };
  if (existing?.id != null) Object.assign(existing, entry);
  else {
    entry.id = Date.now() + Math.random();
    store.push(entry);
  }
}

async function getQuizSession(sessionId: string): Promise<Record<string, unknown> | undefined> {
  return _qsStore().find((s) => s.sessionId === sessionId);
}

async function getActiveQuizSession(subject: string): Promise<Record<string, unknown> | undefined> {
  const store = _qsStore();
  const active = store.find((s) => s.subject === subject && !s.isPaused);
  if (active) return active;
  return store.reduce((a, b) => ((a.lastSavedAt as number) > (b.lastSavedAt as number) ? a : b));
}

async function getAllPausedSessions(): Promise<Record<string, unknown>[]> {
  return _qsStore().filter((s) => s.isPaused);
}

async function resumeQuizSession(sessionId: string): Promise<Record<string, unknown> | undefined> {
  const store = _qsStore();
  const session = store.find((s) => s.sessionId === sessionId);
  if (!session) return undefined;
  session.isPaused = false;
  session.lastSavedAt = Date.now();
  return { ...session, isPaused: false };
}

async function pauseQuizSession(sessionId: string): Promise<void> {
  const store = _qsStore();
  const session = store.find((s) => s.sessionId === sessionId);
  if (session) {
    session.isPaused = true;
    session.lastSavedAt = Date.now();
  }
}

async function deleteQuizSession(sessionId: string): Promise<void> {
  const store = _qsStore();
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].sessionId === sessionId) store.splice(i, 1);
  }
}

async function clearOldQuizSessions(maxAgeHours: number): Promise<void> {
  const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
  const store = _qsStore();
  for (let i = store.length - 1; i >= 0; i--) {
    if ((store[i].lastSavedAt as number) < cutoff) store.splice(i, 1);
  }
}

// --- Inlined visual-cache functions ---
function makeCacheKey(questionId: string, subject: string): string {
  return `${subject}:${questionId}`;
}

async function cacheVisual(
  cacheKey: string,
  _subject: string,
  visual: Record<string, unknown> | null,
): Promise<void> {
  const store = getStore("visuals") as Record<string, unknown>[];
  const existing = store.find((s) => s.cacheKey === cacheKey);
  const entry: Record<string, unknown> = {
    cacheKey,
    visual: safeJsonStringify(visual),
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
  if (existing?.id != null) Object.assign(existing, entry);
  else {
    entry.id = Date.now() + Math.random();
    store.push(entry);
  }
}

async function getCachedVisual(cacheKey: string): Promise<Record<string, unknown> | null> {
  const entry = (getStore("visuals") as Record<string, unknown>[]).find(
    (s) => s.cacheKey === cacheKey,
  );
  if (!entry) return null;
  if (Date.now() > (entry.expiresAt as number)) {
    const idx = (getStore("visuals") as Record<string, unknown>[]).indexOf(entry);
    if (idx >= 0) (getStore("visuals") as Record<string, unknown>[]).splice(idx, 1);
    return null;
  }
  return entry;
}

// --- Inlined question-cache functions ---
async function cacheQuestions(
  subject: string,
  questions: unknown[],
  topic?: string,
): Promise<number> {
  const key = topic ? `${subject}-${topic}` : subject;
  const store = getStore("questions") as Record<string, unknown>[];
  const existing = store.find((s) => s.subject === key);
  const entry: Record<string, unknown> = {
    subject: key,
    topic,
    questions: safeJsonStringify(questions),
    cachedAt: Date.now(),
  };
  if (existing?.id != null) {
    Object.assign(existing, entry);
    return 1;
  }
  entry.id = Date.now() + Math.random();
  store.push(entry);
  return store.length;
}

async function getCachedQuestions(subject: string, topic?: string): Promise<unknown[] | undefined> {
  const key = topic ? `${subject}-${topic}` : subject;
  const store = getStore("questions") as Record<string, unknown>[];
  const cached = store.find((s) => s.subject === key);
  if (!cached) return undefined;
  if (Date.now() - (cached.cachedAt as number) > 24 * 60 * 60 * 1000) return undefined;
  const parsed = JSON.parse(cached.questions as string);
  return Array.isArray(parsed) ? parsed : undefined;
}

// --- Inlined progress functions ---
async function saveProgress(odSubjectId: string, data: Record<string, unknown>): Promise<number> {
  const store = getStore("progress") as Record<string, unknown>[];
  const existing = store.find((s) => s.odSubjectId === odSubjectId);
  const entry: Record<string, unknown> = { ...data, odSubjectId, updatedAt: Date.now() };
  if (existing?.id != null) {
    Object.assign(existing, entry);
    return 1;
  }
  entry.id = Date.now() + Math.random();
  store.push(entry);
  return store.length;
}

async function getProgress(odSubjectId: string): Promise<Record<string, unknown> | undefined> {
  return (getStore("progress") as Record<string, unknown>[]).find(
    (s) => s.odSubjectId === odSubjectId,
  );
}

// --- Inlined conflict functions ---
async function saveConflict(data: Record<string, unknown>): Promise<number> {
  const store = getStore("conflicts") as Record<string, unknown>[];
  const entry: Record<string, unknown> = { ...data };
  entry.id = Date.now() + Math.random();
  store.push(entry);
  return store.length;
}

async function getUnresolvedConflicts(): Promise<Record<string, unknown>[]> {
  return (getStore("conflicts") as Record<string, unknown>[]).filter((s) => s.resolvedAt === 0);
}

async function resolveConflict(id: number, resolution: string): Promise<void> {
  const entry = (getStore("conflicts") as Record<string, unknown>[]).find((s) => s.id === id);
  if (entry) {
    entry.resolvedAt = Date.now();
    entry.resolution = resolution;
  }
}

async function clearResolvedConflicts(): Promise<void> {
  const store = getStore("conflicts") as Record<string, unknown>[];
  for (let i = store.length - 1; i >= 0; i--) {
    if (store[i].resolvedAt) store.splice(i, 1);
  }
}

// Clear stores before each test
beforeEach(() => {
  for (const key of Object.keys(stores)) {
    stores[key] = [];
  }
});

// Factory functions
type StoreItem = Record<string, unknown>;

function createDexieTable(tableName: string) {
  let whereField: string | null = null;
  let _whereOp: "equals" | "below" | "above" | null = null;
  let whereValue: unknown = null;

  function matchField(item: StoreItem): boolean {
    return whereField !== null && item[whereField] === whereValue;
  }

  return {
    where: (field: string) => {
      whereField = field;
      _whereOp = null;
      whereValue = null;
      return {
        equals: (val: string) => {
          _whereOp = "equals";
          whereValue = val;
          return {
            first: async () => {
              const arr = getStore(tableName);
              return arr.find((s) => matchField(s as StoreItem)) ?? undefined;
            },
            toArray: async () => {
              const arr = getStore(tableName);
              return arr.filter((s) => matchField(s as StoreItem));
            },
            delete: async () => {
              const arr = getStore(tableName);
              for (let i = arr.length - 1; i >= 0; i--) {
                if (matchField(arr[i] as StoreItem)) arr.splice(i, 1);
              }
            },
          };
        },
        below: (val: number) => {
          _whereOp = "below";
          whereValue = val;
          return {
            toArray: async () => {
              const arr = getStore(tableName);
              return arr.filter((s) => whereField !== null && (s as StoreItem)[whereField] < val);
            },
            delete: async () => {
              const arr = getStore(tableName);
              for (let i = arr.length - 1; i >= 0; i--) {
                if (whereField !== null && (arr[i] as StoreItem)[whereField] < val) {
                  arr.splice(i, 1);
                }
              }
            },
          };
        },
        above: (val: number) => {
          _whereOp = "above";
          whereValue = val;
          return {
            toArray: async () => {
              const arr = getStore(tableName);
              return arr.filter((s) => whereField !== null && (s as StoreItem)[whereField] > val);
            },
          };
        },
      };
    },
    filter: (fn: (s: StoreItem) => boolean) => ({
      toArray: async () => {
        const arr = getStore(tableName);
        return arr.filter((s) => fn(s as StoreItem));
      },
      delete: async () => {
        const arr = getStore(tableName);
        for (let i = arr.length - 1; i >= 0; i--) {
          if (fn(arr[i] as StoreItem)) arr.splice(i, 1);
        }
      },
    }),
    add: async (item: unknown) => {
      const arr = getStore(tableName);
      arr.push(item as StoreItem);
      return arr.length;
    },
    update: async (id: number, changes: unknown) => {
      const arr = getStore(tableName);
      const entry = arr.find((s) => (s as StoreItem).id === id) as StoreItem | undefined;
      if (entry) Object.assign(entry, changes);
      return 1;
    },
    delete: async (id: number) => {
      const arr = getStore(tableName);
      const idx = arr.findIndex((s) => (s as StoreItem).id === id);
      if (idx >= 0) arr.splice(idx, 1);
    },
    toArray: async () => [...getStore(tableName)],
  };
}

function createQuizAttemptsTable() {
  let whereField: string | null = null;
  const _whereOp: "equals" | "below" | "above" | null = null;
  const _whereValue: unknown = null;

  return {
    add: async (item: unknown) => {
      const arr = getStore("quizAttempts");
      arr.push(item as StoreItem);
      return arr.length;
    },
    where: (field: string) => {
      whereField = field;
      whereOp = null;
      whereValue = null;
      return {
        equals: (val: string) => {
          whereOp = "equals";
          whereValue = val;
          return {
            reverse: () => ({
              limit: (n: number) => ({
                toArray: async () => {
                  const arr = getStore("quizAttempts");
                  return arr
                    .filter((s) => whereField !== null && (s as StoreItem)[whereField] === val)
                    .slice(-n);
                },
              }),
            }),
          };
        },
      };
    },
  };
}

// PDF Cache Tests
describe("pdf-cache repository", () => {
  test("cachePdf stores blob", async () => {
    const blob = new Blob(["fake-pdf-data"], { type: "application/pdf" });
    await cachePdf("paper-1", blob, "exam-2024.pdf");
    expect(getStore("cachedPdfs")).toHaveLength(1);
    const cached = getStore("cachedPdfs")[0] as StoreItem;
    expect(cached.paperId).toBe("paper-1");
    expect(cached.fileName).toBe("exam-2024.pdf");
  });

  test("getCachedPdf returns cached entry", async () => {
    getStore("cachedPdfs").push({ id: 1, paperId: "paper-1" } as StoreItem);
    const result = await getCachedPdf("paper-1");
    expect(result).toBeDefined();
    expect((result as StoreItem).paperId).toBe("paper-1");
  });

  test("getCachedPdf returns undefined for missing", async () => {
    const result = await getCachedPdf("missing");
    expect(result).toBeUndefined();
  });

  test("isPdfCached returns true when cached", async () => {
    getStore("cachedPdfs").push({ id: 1, paperId: "paper-1" } as StoreItem);
    expect(await isPdfCached("paper-1")).toBe(true);
  });

  test("isPdfCached returns false when not cached", async () => {
    expect(await isPdfCached("missing")).toBe(false);
  });

  test("removeCachedPdf deletes entry", async () => {
    getStore("cachedPdfs").push({ id: 1, paperId: "paper-1" } as StoreItem);
    await removeCachedPdf("paper-1");
    expect(getStore("cachedPdfs")).toHaveLength(0);
  });

  test("clearOldPdfCache removes old entries", async () => {
    const now = Date.now();
    getStore("cachedPdfs").push({
      id: 1,
      paperId: "old",
      cachedAt: now - 48 * 60 * 60 * 1000,
    } as StoreItem);
    getStore("cachedPdfs").push({
      id: 2,
      paperId: "new",
      cachedAt: now,
    } as StoreItem);
    await clearOldPdfCache(24);
    expect(getStore("cachedPdfs")).toHaveLength(1);
    expect((getStore("cachedPdfs")[0] as StoreItem).paperId).toBe("new");
  });
});

// Exam Session Tests
describe("exam-session repository", () => {
  test("save creates new entry", async () => {
    await saveExamSession("paper-1", {
      answers: { q1: { value: "A", answeredAt: "2024-01-01" } },
      flags: [],
      currentPartId: "p1",
      timeRemaining: 3600,
      startedAt: 1000,
      completed: false,
    });
    expect(getStore("examSessions")).toHaveLength(1);
    const saved = getStore("examSessions")[0] as StoreItem;
    expect(saved.paperId).toBe("paper-1");
    expect(saved.completed).toBe(false);
  });

  test("get returns saved session", async () => {
    getStore("examSessions").push({ id: 1, paperId: "paper-1" } as StoreItem);
    const result = await getExamSession("paper-1");
    expect(result).toBeDefined();
  });

  test("get returns undefined for missing paper", async () => {
    const result = await getExamSession("nonexistent");
    expect(result).toBeUndefined();
  });

  test("clear removes session", async () => {
    getStore("examSessions").push({ id: 1, paperId: "paper-1" } as StoreItem);
    await clearExamSession("paper-1");
    expect(getStore("examSessions")).toHaveLength(0);
  });

  test("clearOld removes expired sessions", async () => {
    const now = Date.now();
    getStore("examSessions").push({
      id: 1,
      paperId: "old",
      lastSavedAt: now - 48 * 60 * 60 * 1000,
    } as StoreItem);
    getStore("examSessions").push({
      id: 2,
      paperId: "new",
      lastSavedAt: now,
    } as StoreItem);
    await clearOldExamSessions(24);
    expect(getStore("examSessions")).toHaveLength(1);
    expect((getStore("examSessions")[0] as StoreItem).paperId).toBe("new");
  });
});

// Quiz Session Tests
describe("quiz-session repository", () => {
  test("saveQuizSession creates new entry", async () => {
    await saveQuizSession({
      sessionId: "sess-1",
      subject: "math",
      questions: "[]",
      answers: [],
      currentIndex: 0,
      startedAt: 1000,
      isPaused: false,
      duration: 0,
    });
    expect(getStore("quizSessions")).toHaveLength(1);
  });

  test("getQuizSession returns by id", async () => {
    getStore("quizSessions").push({ id: 1, sessionId: "sess-1" } as StoreItem);
    const result = await getQuizSession("sess-1");
    expect(result).toBeDefined();
  });

  test("getActiveQuizSession returns non-paused session", async () => {
    getStore("quizSessions").push({
      id: 1,
      sessionId: "sess-1",
      subject: "math",
      isPaused: false,
    } as StoreItem);
    getStore("quizSessions").push({
      id: 2,
      sessionId: "sess-2",
      subject: "math",
      isPaused: true,
    } as StoreItem);
    const result = await getActiveQuizSession("math");
    expect(result).toBeDefined();
    expect((result as StoreItem).isPaused).toBe(false);
  });

  test("getAllPausedSessions returns paused sessions", async () => {
    getStore("quizSessions").push({ id: 1, isPaused: true } as StoreItem);
    getStore("quizSessions").push({ id: 2, isPaused: false } as StoreItem);
    const result = await getAllPausedSessions();
    expect(result).toHaveLength(1);
  });

  test("resumeQuizSession marks as not paused", async () => {
    getStore("quizSessions").push({
      id: 1,
      sessionId: "sess-1",
      isPaused: true,
    } as StoreItem);
    const resumed = await resumeQuizSession("sess-1");
    expect(resumed).toBeDefined();
    expect((resumed as StoreItem).isPaused).toBe(false);
  });

  test("pauseQuizSession marks as paused", async () => {
    getStore("quizSessions").push({
      id: 1,
      sessionId: "sess-1",
      isPaused: false,
    } as StoreItem);
    await pauseQuizSession("sess-1");
    expect((getStore("quizSessions")[0] as StoreItem).isPaused).toBe(true);
  });

  test("deleteQuizSession removes entry", async () => {
    getStore("quizSessions").push({ id: 1, sessionId: "sess-1" } as StoreItem);
    await deleteQuizSession("sess-1");
    expect(getStore("quizSessions")).toHaveLength(0);
  });

  test("clearOldQuizSessions removes old entries", async () => {
    const now = Date.now();
    getStore("quizSessions").push({
      id: 1,
      lastSavedAt: now - 48 * 60 * 60 * 1000,
    } as StoreItem);
    getStore("quizSessions").push({
      id: 2,
      lastSavedAt: now,
    } as StoreItem);
    await clearOldQuizSessions(24);
    expect(getStore("quizSessions")).toHaveLength(1);
  });
});

// Visual Cache Tests
describe("visual-cache repository", () => {
  test("makeCacheKey creates unique key", () => {
    const key = makeCacheKey("q-1", "math");
    expect(key).toContain("q-1");
    expect(key).toContain("math");
  });

  test("cacheVisual stores visual data", async () => {
    await cacheVisual("q1-math", "math", {
      imageUrl: "https://example.com/img.png",
      altText: "diagram",
      diagramType: "geometry",
    } as StoreItem);
    expect(getStore("visuals")).toHaveLength(1);
  });

  test("getCachedVisual returns cached visual", async () => {
    getStore("visuals").push({
      id: 1,
      cacheKey: "q1-math",
      imageUrl: "url",
    } as StoreItem);
    const result = await getCachedVisual("q1-math");
    expect(result).toBeDefined();
  });

  test("getCachedVisual returns null for missing", async () => {
    const result = await getCachedVisual("missing");
    expect(result).toBeNull();
  });
});

// Question Cache Tests
describe("question-cache repository", () => {
  test("cacheQuestions stores question with topic", async () => {
    await cacheQuestions("math", [{ id: "q-1", text: "Solve for x" }], "algebra");
    expect(getStore("questions")).toHaveLength(1);
    const cached = getStore("questions")[0] as StoreItem;
    expect(cached.subject).toBe("math-algebra");
    expect(cached.topic).toBe("algebra");
    expect(typeof cached.questions).toBe("string");
    expect(cached.cachedAt).toBeCloseTo(Date.now(), -1);
  });

  test("cacheQuestions stores question without topic", async () => {
    await cacheQuestions("math", [{ id: "q-2", text: "Solve for y" }]);
    expect(getStore("questions")).toHaveLength(1);
    const cached = getStore("questions")[0] as StoreItem;
    expect(cached.subject).toBe("math");
    expect(cached.topic).toBeUndefined();
    expect(typeof cached.questions).toBe("string");
    expect(cached.cachedAt).toBeCloseTo(Date.now(), -1);
  });

  test("getCachedQuestions returns cached questions with topic", async () => {
    const now = Date.now();
    getStore("questions").push({
      id: 1,
      subject: "math-algebra",
      topic: "algebra",
      questions: safeJsonStringify([{ id: "q-1" }]),
      cachedAt: now,
    } as StoreItem);
    const result = await getCachedQuestions("math", "algebra");
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual({ id: "q-1" });
  });

  test("getCachedQuestions returns cached questions without topic", async () => {
    const now = Date.now();
    getStore("questions").push({
      id: 1,
      subject: "math",
      questions: safeJsonStringify([{ id: "q-2" }]),
      cachedAt: now,
    } as StoreItem);
    const result = await getCachedQuestions("math");
    expect(result).toBeDefined();
    expect(result).toHaveLength(1);
    expect(result?.[0]).toEqual({ id: "q-2" });
  });

  test("getCachedQuestions returns undefined for missing", async () => {
    const result = await getCachedQuestions("missing");
    expect(result).toBeUndefined();
  });

  test("getCachedQuestions returns undefined for expired cache", async () => {
    const past = Date.now() - 25 * 60 * 60 * 1000;
    getStore("questions").push({
      id: 1,
      subject: "math",
      questions: safeJsonStringify([{ id: "q-1" }]),
      cachedAt: past,
    } as StoreItem);
    const result = await getCachedQuestions("math");
    expect(result).toBeUndefined();
  });
});

// Progress Tests
describe("progress repository", () => {
  test("saveProgress creates new entry", async () => {
    await saveProgress("math-1", {
      questionsAttempted: 10,
      correctCount: 8,
      currentStreak: 3,
      longestStreak: 5,
    });
    expect(getStore("progress")).toHaveLength(1);
  });

  test("saveProgress updates existing entry", async () => {
    getStore("progress").push({
      id: 1,
      odSubjectId: "math-1",
      questionsAttempted: 5,
    } as StoreItem);
    await saveProgress("math-1", {
      questionsAttempted: 10,
      correctCount: 8,
      currentStreak: 3,
      longestStreak: 5,
    });
    expect(getStore("progress")).toHaveLength(1);
    expect((getStore("progress")[0] as StoreItem).questionsAttempted).toBe(10);
  });

  test("getProgress returns by odSubjectId", async () => {
    getStore("progress").push({
      id: 1,
      odSubjectId: "math-1",
      questionsAttempted: 10,
    } as StoreItem);
    const result = await getProgress("math-1");
    expect(result).toBeDefined();
    expect((result as StoreItem).odSubjectId).toBe("math-1");
  });

  test("getProgress returns undefined for missing", async () => {
    const result = await getProgress("missing");
    expect(result).toBeUndefined();
  });
});

// Conflicts Tests
describe("conflicts repository", () => {
  test("saveConflict creates entry", async () => {
    await saveConflict({
      entityType: "competency",
      entityId: "e-1",
      localData: { score: 80 },
      remoteData: { score: 90 },
    } as StoreItem);
    expect(getStore("conflicts")).toHaveLength(1);
  });

  test("getUnresolvedConflicts returns only unresolved", async () => {
    getStore("conflicts").push({ id: 1, resolvedAt: 0 } as StoreItem);
    getStore("conflicts").push({ id: 2, resolvedAt: Date.now() } as StoreItem);
    const result = await getUnresolvedConflicts();
    expect(result).toHaveLength(1);
  });

  test("resolveConflict updates status", async () => {
    getStore("conflicts").push({ id: 1, resolvedAt: 0 } as StoreItem);
    await resolveConflict(1, "local");
    expect((getStore("conflicts")[0] as StoreItem).resolution).toBe("local");
  });

  test("clearResolvedConflicts removes resolved", async () => {
    getStore("conflicts").push({ id: 1, resolvedAt: 0 } as StoreItem);
    getStore("conflicts").push({ id: 2, resolvedAt: Date.now() } as StoreItem);
    await clearResolvedConflicts();
    expect(getStore("conflicts")).toHaveLength(1);
  });
});
