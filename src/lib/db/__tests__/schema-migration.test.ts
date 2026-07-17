import "fake-indexeddb/auto";
import { describe, it, expect, afterAll } from "vitest";
import { LumniOfflineDB } from "@/lib/db/schema";

const EXPECTED_TABLES = [
  "analyticsEvents",
  "assignmentMessages",
  "bookmarks",
  "cachedPdfs",
  "chatMessages",
  "competencies",
  "competitionScores",
  "conflicts",
  "dictionaryCache",
  "essayDrafts",
  "examDates",
  "examSessions",
  "extractionCache",
  "flashcardSyncState",
  "flashcards",
  "gamification",
  "groupBadges",
  "groupChallengeEntries",
  "groupChallenges",
  "groupComments",
  "groupPosts",
  "groupReactions",
  "jobs",
  "knowledgeGraph",
  "lessonCache",
  "lessonProgress",
  "notes",
  "onboardingState",
  "packQuestions",
  "pastPaperQuestions",
  "pronunciationHistory",
  "progress",
  "questionEmbeddings",
  "questionRatings",
  "questions",
  "quizAttempts",
  "quizPacks",
  "quizSessions",
  "retentionRecurrence",
  "reviewHistory",
  "seenPastPaperQuestions",
  "sharedQuestions",
  "srDailyBudget",
  "sttCache",
  "sttUsage",
  "storyCache",
  "storyProgress",
  "storyQuestions",
  "studyGuides",
  "studyPlans",
  "subjects",
  "syncCheckpoints",
  "syncOutbox",
  "teacherObservations",
  "tinyfishCache",
  "tinyfishUsage",
  "userConsents",
  "userSettings",
  "vocabularyList",
  "visuals",
  "webhookDeliveries",
  "webhookEndpoints",
  "wrongAnswers",
  "schools",
  "schoolMembers",
  "schoolCodes",
  "licenses",
  "invoices",
  "studyCommitments",
];

const COMPOUND_INDEX_TABLES = [
  { table: "packQuestions", key: { packId: "test-pack", questionIndex: 0 } },
  { table: "tinyfishUsage", key: { userId: "test", date: "2026-01-01" } },
  { table: "lessonProgress", key: { userId: "test", lessonId: "lesson-1" } },
  { table: "storyProgress", key: { userId: "test", storyId: "story-1" } },
  { table: "schoolMembers", key: { schoolId: "s-1", userId: "u-1" } },
  { table: "vocabularyList", key: { userId: "test", word: "hello" } },
];

describe("Dexie schema migration", () => {
  let db: LumniOfflineDB;

  afterAll(async () => {
    if (db?.isOpen()) {
      db.close();
      await db.delete();
    }
  });

  it("opens at latest version without error", async () => {
    db = new LumniOfflineDB();
    await db.open();
    expect(db.isOpen()).toBe(true);
    expect(db.verno).toBe(49);
  });

  it("all table names are accessible after opening", () => {
    const tableNames = db.tables.map((t) => t.name);
    for (const name of EXPECTED_TABLES) {
      expect(tableNames).toContain(name);
    }
    expect(db.tables.length).toBeGreaterThanOrEqual(EXPECTED_TABLES.length);
  });

  it.each(COMPOUND_INDEX_TABLES)(
    "compound index on $table does not throw on where() query",
    ({ table, key }) => {
      expect(() => db.table(table).where(key)).not.toThrow();
    },
  );

  it("data round-trips through flashcards table (string PK)", async () => {
    const record = {
      id: "test-card-1",
      subject: "mathematics",
      topic: "algebra",
      nextReview: Date.now(),
      easeFactor: 2.5,
      interval: 0,
      repetitions: 0,
      status: "learning" as const,
      learningStep: 0,
      leeched: false,
      updatedAt: Date.now(),
    };
    await db.flashcards.put(record);
    const read = await db.flashcards.get("test-card-1");
    expect(read).toBeDefined();
    expect(read!.subject).toBe("mathematics");
    await db.flashcards.delete("test-card-1");
    const gone = await db.flashcards.get("test-card-1");
    expect(gone).toBeUndefined();
  });

  it("data round-trips through questions table (auto-increment PK)", async () => {
    const record = {
      subject: "physics",
      topic: "mechanics",
      questions: "[]",
      cachedAt: Date.now(),
    };
    const id = await db.questions.add(record);
    expect(id).toBeGreaterThan(0);
    const read = await db.questions.get(id);
    expect(read).toBeDefined();
    expect(read!.subject).toBe("physics");
    await db.questions.delete(id);
    const gone = await db.questions.get(id);
    expect(gone).toBeUndefined();
  });

  it("data round-trips through competencies table", async () => {
    const record = {
      subjectId: "math",
      topicId: "algebra",
      bloomLevel: "apply" as const,
      level: "developing" as const,
      score: 0.65,
      lastAssessed: Date.now(),
      userId: "test-user",
    };
    const id = await db.competencies.add(record);
    expect(id).toBeGreaterThan(0);
    const read = await db.competencies.get(id);
    expect(read).toBeDefined();
    expect(read!.subjectId).toBe("math");
    expect(read!.score).toBe(0.65);
    await db.competencies.delete(id);
    const gone = await db.competencies.get(id);
    expect(gone).toBeUndefined();
  });
});
