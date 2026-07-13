import { describe, it, expect, vi } from "vitest";
import { searchInChunks, scoreMatch } from "../chunked-search";
import type { SearchResultItem } from "@/lib/services/search-service/types";

describe("scoreMatch", () => {
  it("returns 100 for exact match", () => {
    expect(scoreMatch("quadratic formula", "quadratic formula")).toBe(100);
  });

  it("returns 80 when text starts with query", () => {
    expect(scoreMatch("quadratic formula", "quadratic")).toBe(80);
  });

  it("returns 50 when text contains query", () => {
    expect(scoreMatch("the quadratic formula", "quadratic")).toBe(50);
  });

  it("returns 0 when query not found", () => {
    expect(scoreMatch("algebra", "calculus")).toBe(0);
  });

  it("is case-insensitive", () => {
    expect(scoreMatch("QUADRATIC Formula", "quadratic")).toBe(80);
  });
});

describe("searchInChunks", () => {
  it("returns empty array for empty query", async () => {
    const result = await searchInChunks("", []);
    expect(result).toEqual([]);
  });

  it("merges results from multiple handlers", async () => {
    const h1 = vi.fn().mockResolvedValue([
      {
        id: "q-1",
        type: "question" as const,
        title: "Quadratic formula",
        snippet: "ax²+bx+c",
        subject: "Maths",
        createdAt: 100,
      },
    ]);
    const h2 = vi.fn().mockResolvedValue([
      {
        id: "n-1",
        type: "note" as const,
        title: "Algebra notes",
        snippet: "quadratic equations",
        subject: "Maths",
        createdAt: 200,
      },
    ]);

    const result = await searchInChunks("quadratic", [
      { name: "questions", handler: h1 },
      { name: "notes", handler: h2 },
    ]);

    expect(result).toHaveLength(2);
    expect(result.map((r) => r.id)).toEqual(["q-1", "n-1"]);
  });

  it("sorts by relevance descending (exact > prefix > substring)", async () => {
    const handlers = [
      {
        name: "substring",
        handler: () =>
          Promise.resolve<SearchResultItem[]>([
            {
              id: "2",
              type: "note",
              title: "The quadratic formula explained",
              snippet: "details",
              subject: "Maths",
              createdAt: 1,
            },
          ]),
      },
      {
        name: "starts",
        handler: () =>
          Promise.resolve<SearchResultItem[]>([
            {
              id: "1",
              type: "question",
              title: "Quadratic is a test",
              snippet: "more",
              subject: "Maths",
              createdAt: 2,
            },
          ]),
      },
      {
        name: "exact",
        handler: () =>
          Promise.resolve<SearchResultItem[]>([
            {
              id: "0",
              type: "flashcard",
              title: "Quadratic",
              snippet: "exact",
              subject: "Maths",
              createdAt: 3,
            },
          ]),
      },
    ];

    const result = await searchInChunks("Quadratic", handlers);
    expect(result[0].id).toBe("0");
    expect(result[1].id).toBe("1");
    expect(result[2].id).toBe("2");
  });

  it("handles handler rejections gracefully (timeout)", async () => {
    const h1 = vi.fn().mockResolvedValue([
      {
        id: "q-1",
        type: "question" as const,
        title: "Quadratic formula",
        snippet: "abc",
        subject: "Maths",
        createdAt: 100,
      },
    ]);
    const h2 = vi
      .fn()
      .mockImplementation(
        () =>
          new Promise<SearchResultItem[]>((_, reject) =>
            setTimeout(() => reject(new Error("timeout")), 1000),
          ),
      );

    const result = await searchInChunks("quadratic", [
      { name: "questions", handler: h1 },
      { name: "slow", handler: h2 },
    ]);

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("q-1");
  });

  it("caps results at maxResults", async () => {
    const handlers = [
      {
        name: "source-1",
        handler: () =>
          Promise.resolve(
            Array.from({ length: 15 }, (_, i) => ({
              id: `r-${i}`,
              type: "note" as const,
              title: `Result ${i} about algebra`,
              snippet: "snippet",
              subject: "Maths",
              createdAt: i,
            })),
          ),
      },
      {
        name: "source-2",
        handler: () =>
          Promise.resolve(
            Array.from({ length: 15 }, (_, i) => ({
              id: `r2-${i}`,
              type: "question" as const,
              title: `Question ${i} about algebra`,
              snippet: "desc",
              subject: "Maths",
              createdAt: i + 100,
            })),
          ),
      },
    ];

    const result = await searchInChunks("algebra", handlers, 15);
    expect(result.length).toBeLessThanOrEqual(15);
  });
});
