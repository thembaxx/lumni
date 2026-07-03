import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockAdd = vi.fn<(item: unknown) => Promise<number>>();
const mockToArray = vi.fn<() => Promise<unknown[]>>();
const mockWhere = vi.fn(() => ({
  equals: vi.fn(() => ({
    toArray: mockToArray,
  })),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: { $id: "user-1" },
    status: "authenticated",
    isAnonymous: false,
  })),
}));

vi.mock("@/lib/db", () => ({
  dexieDataAccess: {
    essayDrafts: {
      add: mockAdd,
      where: mockWhere,
    },
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

const { useEssayCoaching } = await import("@/hooks/use-essay-coaching");

describe("useEssayCoaching", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads existing drafts from Dexie on mount", async () => {
    mockToArray.mockResolvedValue([
      {
        id: 1,
        userId: "user-1",
        questionId: "q-1",
        draftNumber: 1,
        content: "Essay v1",
        aiFeedback: "Good",
        score: 7,
        maxScore: 10,
        createdAt: 1000,
      },
    ]);

    const { result } = renderHook(() => useEssayCoaching("q-1"));

    await waitFor(() => expect(result.current.drafts.length).toBe(1));
    expect(result.current.drafts[0]).toEqual({
      draftNumber: 1,
      content: "Essay v1",
      feedback: "Good",
      score: 7,
      maxScore: 10,
    });
  });

  test("startCoaching saves initial draft to Dexie", async () => {
    mockToArray.mockResolvedValue([]);
    mockAdd.mockResolvedValue(1);

    const { result } = renderHook(() => useEssayCoaching("q-1"));

    await waitFor(() => expect(result.current.drafts.length).toBe(0));

    act(() => {
      result.current.startCoaching("Initial essay", {
        correct: true,
        score: 8,
        maxScore: 10,
        feedback: "Well written",
      });
    });

    expect(result.current.drafts).toHaveLength(1);
    expect(result.current.drafts[0].content).toBe("Initial essay");
    expect(mockAdd).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        questionId: "q-1",
        userId: "user-1",
        draftNumber: 1,
        content: "Initial essay",
        aiFeedback: "Well written",
        score: 8,
        maxScore: 10,
      }),
    );
  });

  test("submitRevision adds new draft to Dexie", async () => {
    mockToArray.mockResolvedValue([]);
    mockAdd.mockResolvedValue(1);

    const { result } = renderHook(() => useEssayCoaching("q-1"));

    await waitFor(() => expect(result.current.drafts.length).toBe(0));

    act(() => {
      result.current.startCoaching("First draft", {
        correct: true,
        score: 5,
        maxScore: 10,
        feedback: "Needs work",
      });
    });

    expect(result.current.drafts).toHaveLength(1);

    mockAdd.mockResolvedValue(2);

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          correct: true,
          score: 8,
          maxScore: 10,
          feedback: "Good improvement",
        }),
    });

    await act(async () => {
      await result.current.submitRevision("Revised draft");
    });

    expect(result.current.drafts).toHaveLength(2);
    expect(result.current.drafts[1].content).toBe("Revised draft");
    expect(mockAdd).toHaveBeenCalledTimes(2);
    expect(mockAdd).toHaveBeenLastCalledWith(
      expect.objectContaining({
        questionId: "q-1",
        userId: "user-1",
        draftNumber: 2,
        content: "Revised draft",
        aiFeedback: "Good improvement",
        score: 8,
        maxScore: 10,
      }),
    );
  });
});
