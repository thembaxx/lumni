import { describe, expect, test } from "vitest";

const { seedConfig } = await import("../ensure-config");

describe("ensure-config", () => {
  test("seedConfig has subjects and topics", () => {
    expect(seedConfig.subjects).toBeDefined();
    expect(seedConfig.topics).toBeDefined();
  });

  test("subjects matchField is code", () => {
    expect(seedConfig.subjects.matchField).toBe("code");
  });

  test("subjects documents are static array with 24 entries", () => {
    const docs = seedConfig.subjects.documents;
    expect(Array.isArray(docs)).toBe(true);
    expect(docs).toHaveLength(24);
  });

  test("subjects include mathematics with correct props", () => {
    const docs = seedConfig.subjects.documents as Array<Record<string, unknown>>;
    const math = docs.find((d) => d.code === "mathematics");
    expect(math).toBeDefined();
    expect((math as Record<string, string>).name).toBe("Mathematics");
    expect((math as Record<string, string>).category).toBe("mathematics");
  });

  test("topics documents is async function using seeded subjects", async () => {
    const seeded = {
      subjects: [
        { $id: "subj-1", code: "mathematics", name: "Mathematics" },
        { $id: "subj-2", code: "physical-sciences", name: "Physical Sciences" },
        { $id: "subj-3", code: "life-sciences", name: "Life Sciences" },
      ],
    };
    const docsFn = seedConfig.topics.documents;
    expect(typeof docsFn).toBe("function");
    const docs = await (docsFn as (s: typeof seeded) => Array<Record<string, unknown>>)(seeded);
    expect(docs).toHaveLength(30);

    const calculus = docs.find((d) => d.name === "Calculus");
    expect(calculus).toBeDefined();
    expect((calculus as Record<string, string>).subjectId).toBe("subj-1");
  });
});
