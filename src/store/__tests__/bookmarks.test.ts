import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/bookmark-service", () => ({
  bookmarkService: {
    add: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    updateNote: vi.fn(async () => {}),
    getAll: vi.fn(async () => []),
    isBookmarked: vi.fn(async () => false),
  },
}));

import { useBookmarksStore } from "../bookmarks";

beforeEach(() => {
  useBookmarksStore.setState({ bookmarks: [], hydrated: false });
});

describe("useBookmarksStore", () => {
  test("initial state has empty bookmarks", () => {
    expect(useBookmarksStore.getState().bookmarks).toEqual([]);
  });

  test("addBookmark adds a bookmark with savedAt timestamp", () => {
    useBookmarksStore.getState().addBookmark({
      id: "q1",
      questionText: "What is 2+2?",
      subject: "mathematics",
      topic: "algebra",
    });
    const { bookmarks } = useBookmarksStore.getState();
    expect(bookmarks).toHaveLength(1);
    expect(bookmarks[0].id).toBe("q1");
    expect(bookmarks[0].questionText).toBe("What is 2+2?");
    expect(bookmarks[0].savedAt).toBeGreaterThan(0);
  });

  test("addBookmark prevents duplicates by id", () => {
    const bookmark = {
      id: "q1",
      questionText: "Test?",
      subject: "math",
      topic: "alg",
    };
    useBookmarksStore.getState().addBookmark(bookmark);
    useBookmarksStore.getState().addBookmark(bookmark);
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(1);
  });

  test("addBookmark prepends new bookmarks", () => {
    useBookmarksStore.getState().addBookmark({
      id: "q1",
      questionText: "First",
      subject: "math",
      topic: "alg",
    });
    useBookmarksStore.getState().addBookmark({
      id: "q2",
      questionText: "Second",
      subject: "math",
      topic: "alg",
    });
    const { bookmarks } = useBookmarksStore.getState();
    expect(bookmarks[0].id).toBe("q2");
    expect(bookmarks[1].id).toBe("q1");
  });

  test("removeBookmark removes by id", () => {
    useBookmarksStore.getState().addBookmark({
      id: "q1",
      questionText: "Test",
      subject: "math",
      topic: "alg",
    });
    useBookmarksStore.getState().removeBookmark("q1");
    expect(useBookmarksStore.getState().bookmarks).toHaveLength(0);
  });

  test("updateNote updates the note on a bookmark", () => {
    useBookmarksStore.getState().addBookmark({
      id: "q1",
      questionText: "Test",
      subject: "math",
      topic: "alg",
    });
    useBookmarksStore.getState().updateNote("q1", "my note");
    expect(useBookmarksStore.getState().bookmarks[0].note).toBe("my note");
  });

  test("updateNote only affects the target bookmark", () => {
    useBookmarksStore.getState().addBookmark({
      id: "q1",
      questionText: "First",
      subject: "math",
      topic: "alg",
    });
    useBookmarksStore.getState().addBookmark({
      id: "q2",
      questionText: "Second",
      subject: "math",
      topic: "alg",
    });
    useBookmarksStore.getState().updateNote("q1", "note1");
    const { bookmarks } = useBookmarksStore.getState();
    expect(bookmarks.find((b) => b.id === "q1")?.note).toBe("note1");
    expect(bookmarks.find((b) => b.id === "q2")?.note).toBeUndefined();
  });

  test("isBookmarked returns correct status", () => {
    expect(useBookmarksStore.getState().isBookmarked("q1")).toBe(false);
    useBookmarksStore.getState().addBookmark({
      id: "q1",
      questionText: "Test",
      subject: "math",
      topic: "alg",
    });
    expect(useBookmarksStore.getState().isBookmarked("q1")).toBe(true);
  });
});
