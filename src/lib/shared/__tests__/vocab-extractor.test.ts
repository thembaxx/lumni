import { describe, it, expect } from "vitest";
import { extractVocabularyCandidates } from "../vocab-extractor";

describe("extractVocabularyCandidates", () => {
  it("extracts words longer than 3 characters", () => {
    const result = extractVocabularyCandidates("The mitochondria is the powerhouse of the cell");
    expect(result).toContain("mitochondria");
    expect(result).toContain("powerhouse");
  });

  it("excludes common stop words", () => {
    const result = extractVocabularyCandidates("The and or but for with from");
    expect(result).toHaveLength(0);
  });

  it("excludes short words", () => {
    const result = extractVocabularyCandidates("a an in on at to it");
    expect(result).toHaveLength(0);
  });

  it("excludes numbers", () => {
    const result = extractVocabularyCandidates("The value 1234 is higher than 5678");
    expect(result).not.toContain("1234");
    expect(result).not.toContain("5678");
  });

  it("deduplicates words", () => {
    const result = extractVocabularyCandidates("Function calls another function");
    const count = result.filter((w) => w === "function").length;
    expect(count).toBe(1);
  });

  it("respects maxWords limit", () => {
    const result = extractVocabularyCandidates(
      "Photosynthesis respiration fermentation osmosis diffusion cellular organism",
      3,
    );
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("ignores punctuation around words", () => {
    const result = extractVocabularyCandidates("Hello, world! Testing...");
    expect(result).toContain("hello");
    expect(result).toContain("world");
    expect(result).toContain("testing");
  });

  it("returns empty array for empty text", () => {
    expect(extractVocabularyCandidates("")).toEqual([]);
  });

  it("returns empty array for text with only stop words", () => {
    expect(extractVocabularyCandidates("the and for with")).toEqual([]);
  });
});
