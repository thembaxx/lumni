import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryDataAccess } from "@/lib/db/in-memory-data-access";
import {
  savePronunciationScore,
  getPronunciationHistory,
  getPronunciationStats,
  __setDepsForTesting,
} from "../service";

describe("PronunciationHistoryService", () => {
  let db: InMemoryDataAccess;

  beforeEach(() => {
    db = new InMemoryDataAccess();
    // oxlint-disable-next-line typescript/no-explicit-any — DI injection pattern used across 30+ test files
    __setDepsForTesting({ db: db as any });
  });

  describe("savePronunciationScore", () => {
    it("saves a score entry", async () => {
      await savePronunciationScore("user1", "hello", 85, 90, 80, 75, "en");
      const history = await getPronunciationHistory("user1");
      expect(history).toHaveLength(1);
      expect(history[0].word).toBe("hello");
      expect(history[0].overallScore).toBe(85);
    });

    it("defaults language to en when not provided", async () => {
      await savePronunciationScore("user1", "test", 50, 50, 50, 50, "en");
      const history = await getPronunciationHistory("user1");
      expect(history[0].language).toBe("en");
    });

    it("stores word as provided", async () => {
      const word = "hello";
      await savePronunciationScore("user1", word, 50, 50, 50, 50, "en");
      const history = await getPronunciationHistory("user1");
      expect(history[0].word).toBe(word);
    });
  });

  describe("getPronunciationHistory", () => {
    it("returns empty array for user with no history", async () => {
      const history = await getPronunciationHistory("newuser");
      expect(history).toEqual([]);
    });

    it("returns history ordered by attemptedAt descending", async () => {
      const now = Date.now();
      await db.pronunciationHistory.add({
        userId: "user1",
        word: "first",
        overallScore: 60,
        wordAccuracy: 60,
        phonemeAccuracy: 60,
        fluencyScore: 60,
        language: "en",
        attemptedAt: now,
      });
      await db.pronunciationHistory.add({
        userId: "user1",
        word: "second",
        overallScore: 70,
        wordAccuracy: 70,
        phonemeAccuracy: 70,
        fluencyScore: 70,
        language: "en",
        attemptedAt: now + 1000,
      });
      await db.pronunciationHistory.add({
        userId: "user1",
        word: "third",
        overallScore: 80,
        wordAccuracy: 80,
        phonemeAccuracy: 80,
        fluencyScore: 80,
        language: "en",
        attemptedAt: now + 2000,
      });

      const history = await getPronunciationHistory("user1");
      expect(history).toHaveLength(3);
      const words = history.map((h) => h.word);
      // Most recent first: third has the highest attemptedAt
      expect(words.indexOf("third")).toBeLessThan(words.indexOf("second"));
      expect(words.indexOf("second")).toBeLessThan(words.indexOf("first"));
    });

    it("filters by userId only", async () => {
      await savePronunciationScore("user1", "word1", 50, 50, 50, 50, "en");
      await savePronunciationScore("user2", "word2", 60, 60, 60, 60, "en");

      const history1 = await getPronunciationHistory("user1");
      const history2 = await getPronunciationHistory("user2");
      expect(history1).toHaveLength(1);
      expect(history1[0].word).toBe("word1");
      expect(history2).toHaveLength(1);
      expect(history2[0].word).toBe("word2");
    });

    it("respects limit parameter", async () => {
      for (let i = 0; i < 10; i++) {
        await savePronunciationScore("user1", `word${i}`, 50, 50, 50, 50, "en");
      }
      const history = await getPronunciationHistory("user1", 5);
      expect(history).toHaveLength(5);
    });
  });

  describe("getPronunciationStats", () => {
    it("returns zero stats for user with no history", async () => {
      const stats = await getPronunciationStats("newuser");
      expect(stats.totalAttempts).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.recentScores).toEqual([]);
      expect(stats.topWords).toEqual([]);
    });

    it("computes average score correctly", async () => {
      await savePronunciationScore("user1", "hello", 80, 80, 80, 80, "en");
      await savePronunciationScore("user1", "world", 60, 60, 60, 60, "en");

      const stats = await getPronunciationStats("user1");
      expect(stats.totalAttempts).toBe(2);
      expect(stats.averageScore).toBe(70);
    });

    it("returns recent scores limited to 20", async () => {
      for (let i = 0; i < 25; i++) {
        await savePronunciationScore("user1", `word${i}`, 50 + i, 50, 50, 50, "en");
      }
      const stats = await getPronunciationStats("user1");
      expect(stats.recentScores.length).toBeLessThanOrEqual(20);
    });

    it("tracks top words by frequency", async () => {
      await savePronunciationScore("user1", "hello", 80, 80, 80, 80, "en");
      await savePronunciationScore("user1", "hello", 90, 90, 90, 90, "en");
      await savePronunciationScore("user1", "hello", 70, 70, 70, 70, "en");
      await savePronunciationScore("user1", "world", 50, 50, 50, 50, "en");

      const stats = await getPronunciationStats("user1");
      expect(stats.topWords).toHaveLength(2);
      expect(stats.topWords[0].word).toBe("hello");
      expect(stats.topWords[0].count).toBe(3);
      expect(stats.topWords[0].avgScore).toBeCloseTo(80, 0);
      expect(stats.topWords[1].word).toBe("world");
      expect(stats.topWords[1].count).toBe(1);
    });

    it("limits top words to 5", async () => {
      for (let i = 0; i < 15; i++) {
        await savePronunciationScore("user1", `word${i}`, 50, 50, 50, 50, "en");
      }
      const stats = await getPronunciationStats("user1");
      expect(stats.topWords.length).toBeLessThanOrEqual(5);
    });
  });
});
