import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockApiFetch = vi.fn<(url: string, options: RequestInit) => unknown>();

vi.mock("@/lib/shared/api-fetch", () => ({
  apiFetch: mockApiFetch,
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

const { useLiveSession } = await import("@/hooks/use-live-session");

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

const mockSession = {
  $id: "session-1",
  groupId: "group-1",
  startedBy: "user-1",
  startedByName: "Alice",
  subject: "Mathematics",
  status: "active" as const,
  startedAt: new Date().toISOString(),
};

describe("useLiveSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns loading state initially", () => {
    mockApiFetch.mockReturnValue(new Promise<never>(() => {}));

    const { result } = renderHook(() => useLiveSession("group-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.session).toBeNull();
  });

  test("returns session when one exists", async () => {
    mockApiFetch.mockResolvedValue({ session: mockSession });

    const { result } = renderHook(() => useLiveSession("group-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toEqual(mockSession);
  });

  test("returns null session when none exists", async () => {
    mockApiFetch.mockResolvedValue({ session: null });

    const { result } = renderHook(() => useLiveSession("group-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();
  });

  test("returns null session when groupId is undefined", async () => {
    const { result } = renderHook(() => useLiveSession(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.session).toBeNull();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  test("startSession creates a new session", async () => {
    mockApiFetch
      .mockResolvedValueOnce({ session: null })
      .mockResolvedValueOnce({ session: mockSession });

    const { result } = renderHook(() => useLiveSession("group-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.session).toBeNull();

    await act(async () => {
      const session = await result.current.startSession("Mathematics");
      expect(session).toEqual({ session: mockSession });
    });
  });

  test("isStarting reflects mutation pending state", async () => {
    const neverResolve = new Promise<never>(() => {});
    mockApiFetch.mockResolvedValueOnce({ session: null }).mockReturnValueOnce(neverResolve);

    const { result } = renderHook(() => useLiveSession("group-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isStarting).toBe(false);

    act(() => {
      result.current.startSession();
    });

    await waitFor(() => expect(result.current.isStarting).toBe(true));
  });
});
