import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { useStudyBuddies } from "@/hooks/use-study-buddies";

const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockCommitments = [
  { id: 1, buddyUserId: "u1", buddyName: "Alice", subject: "Math", status: "pending", createdAt: "2026-07-01" },
  { id: 2, buddyUserId: "u2", buddyName: "Bob", subject: "Science", status: "active", createdAt: "2026-07-02" },
];

describe("useStudyBuddies", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("initializes with empty commitments", () => {
    const { result } = renderHook(() => useStudyBuddies());
    expect(result.current.commitments).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  test("fetchCommitments populates commitments", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ commitments: mockCommitments }),
    });

    const { result } = renderHook(() => useStudyBuddies());
    await act(async () => {
      await result.current.fetchCommitments();
    });

    expect(result.current.commitments).toEqual(mockCommitments);
    expect(mockFetch).toHaveBeenCalledWith("/api/study-buddies/commitments");
  });

  test("acceptCommitment returns true on success", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useStudyBuddies());
    const accepted = await result.current.acceptCommitment(1);

    expect(accepted).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/study-buddies/commitments/1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "accept" }),
    });
  });

  test("declineCommitment returns true on success", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useStudyBuddies());
    const declined = await result.current.declineCommitment(2);

    expect(declined).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/study-buddies/commitments/2", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decline" }),
    });
  });

  test("completeCommitment returns true on success", async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useStudyBuddies());
    const completed = await result.current.completeCommitment(3);

    expect(completed).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith("/api/study-buddies/commitments/3", {
      method: "DELETE",
    });
  });

  test("acceptCommitment returns false on failure", async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useStudyBuddies());
    const accepted = await result.current.acceptCommitment(1);

    expect(accepted).toBe(false);
  });
});
