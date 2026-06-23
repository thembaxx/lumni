import { beforeAll, beforeEach, describe, expect, test } from "vitest";

const mockStore = new Map<string, string>();

beforeAll(async () => {
  Object.defineProperty(globalThis, "window", {
    value: {},
    writable: true,
    configurable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => mockStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        mockStore.set(key, value);
      },
      removeItem: (key: string) => {
        mockStore.delete(key);
      },
      clear: () => mockStore.clear(),
      get length() {
        return mockStore.size;
      },
      key: (i: number) => [...mockStore.keys()][i] ?? null,
    },
    writable: true,
    configurable: true,
  });
});

const { recordQuality, loadQualityRecords, getQualityStats, clearQualityRecords } =
  await import("../engine-quality");

beforeEach(() => {
  mockStore.clear();
});

describe("recordQuality", () => {
  test("stores a quality record", () => {
    recordQuality({
      subject: "math",
      questionType: "multiple-choice",
      validationScore: 85,
      isValid: true,
      errorCount: 1,
      warningCount: 0,
    });
    const records = loadQualityRecords();
    expect(records).toHaveLength(1);
    expect(records[0].subject).toBe("math");
    expect(records[0].validationScore).toBe(85);
  });

  test("timestamps the record", () => {
    const before = Date.now();
    recordQuality({
      subject: "physics",
      questionType: "calculation",
      validationScore: 90,
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
    const records = loadQualityRecords();
    expect(records[0].timestamp).toBeGreaterThanOrEqual(before);
    expect(records[0].timestamp).toBeLessThanOrEqual(Date.now());
  });
});

describe("loadQualityRecords", () => {
  test("returns empty array when no records", () => {
    expect(loadQualityRecords()).toEqual([]);
  });

  test("returns previously stored records", () => {
    recordQuality({
      subject: "chem",
      questionType: "short-answer",
      validationScore: 70,
      isValid: false,
      errorCount: 2,
      warningCount: 1,
    });
    const records = loadQualityRecords();
    expect(records).toHaveLength(1);
    expect(records[0].validationScore).toBe(70);
  });
});

describe("getQualityStats", () => {
  test("returns empty stats when no records", () => {
    const stats = getQualityStats();
    expect(stats).toEqual({
      total: 0,
      avgScore: 0,
      passRate: 0,
      byType: {},
    });
  });

  test("calculates stats for single record", () => {
    recordQuality({
      subject: "math",
      questionType: "multiple-choice",
      validationScore: 80,
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
    const stats = getQualityStats();
    expect(stats.total).toBe(1);
    expect(stats.avgScore).toBe(80);
    expect(stats.passRate).toBe(100);
  });

  test("calculates avgScore across multiple records", () => {
    recordQuality({
      subject: "math",
      questionType: "multiple-choice",
      validationScore: 100,
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
    recordQuality({
      subject: "math",
      questionType: "multiple-choice",
      validationScore: 50,
      isValid: false,
      errorCount: 3,
      warningCount: 0,
    });
    const stats = getQualityStats();
    expect(stats.total).toBe(2);
    expect(stats.avgScore).toBe(75);
  });

  test("groups by type", () => {
    recordQuality({
      subject: "math",
      questionType: "mcq",
      validationScore: 90,
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
    recordQuality({
      subject: "physics",
      questionType: "calculation",
      validationScore: 80,
      isValid: true,
      errorCount: 1,
      warningCount: 0,
    });
    const stats = getQualityStats();
    expect(Object.keys(stats.byType).toSorted()).toEqual(["calculation", "mcq"]);
    expect(stats.byType.mcq).toEqual({ count: 1, avgScore: 90 });
    expect(stats.byType.calculation).toEqual({ count: 1, avgScore: 80 });
  });

  test("calculates passRate correctly", () => {
    recordQuality({
      subject: "math",
      questionType: "mcq",
      validationScore: 90,
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
    recordQuality({
      subject: "math",
      questionType: "mcq",
      validationScore: 30,
      isValid: false,
      errorCount: 5,
      warningCount: 2,
    });
    recordQuality({
      subject: "math",
      questionType: "mcq",
      validationScore: 80,
      isValid: true,
      errorCount: 0,
      warningCount: 1,
    });
    const stats = getQualityStats();
    expect(stats.passRate).toBe(67);
  });
});

describe("clearQualityRecords", () => {
  test("clears all records", () => {
    recordQuality({
      subject: "math",
      questionType: "mcq",
      validationScore: 90,
      isValid: true,
      errorCount: 0,
      warningCount: 0,
    });
    clearQualityRecords();
    expect(loadQualityRecords()).toEqual([]);
  });
});
