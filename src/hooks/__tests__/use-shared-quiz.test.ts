import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockEnter = vi.fn();
const mockLeave = vi.fn();
const mockUpdate = vi.fn();
const mockGet = vi.fn();
const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockPublish = vi.fn();
const mockDetach = vi.fn();
const mockClose = vi.fn();

const mockChannel = {
  presence: {
    enter: mockEnter,
    leave: mockLeave,
    update: mockUpdate,
    get: mockGet,
    subscribe: mockSubscribe,
    unsubscribe: mockUnsubscribe,
  },
  publish: mockPublish,
  detach: mockDetach,
};

const mockChannels = {
  get: vi.fn(() => mockChannel),
};

function FakeRealtime() {
  return {
    channels: mockChannels,
    close: mockClose,
  };
}

vi.mock("ably", () => ({
  default: {
    Realtime: FakeRealtime,
  },
  Realtime: FakeRealtime,
  ErrorInfo: class ErrorInfo extends Error {
    constructor(
      message: string,
      public code: number,
      public statusCode: number,
    ) {
      super(message);
      this.name = "ErrorInfo";
    }
  },
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { $id: "user-1", name: "Alice" },
    authReady: true,
  }),
}));

const { useSharedQuiz } = await import("@/hooks/use-shared-quiz");

describe("useSharedQuiz", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("returns default state when channelName is null", () => {
    const { result } = renderHook(() => useSharedQuiz(null));

    expect(result.current.participants).toEqual([]);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.currentUserProgress).toBe(0);
  });

  test("enters presence when channelName is provided", () => {
    mockGet.mockImplementation((_params: null, cb: (err: unknown, members: unknown[]) => void) =>
      cb(null, []),
    );

    renderHook(() => useSharedQuiz("test-channel"));

    expect(mockChannels.get).toHaveBeenCalledWith("shared-quiz:test-channel");
    expect(mockEnter).toHaveBeenCalledWith({
      userId: "user-1",
      userName: "Alice",
      score: 0,
      progress: 0,
    });
  });

  test("cleans up on unmount", () => {
    mockGet.mockImplementation((_params: null, cb: (err: unknown, members: unknown[]) => void) =>
      cb(null, []),
    );

    const { unmount } = renderHook(() => useSharedQuiz("test-channel"));
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(mockLeave).toHaveBeenCalled();
    expect(mockDetach).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });

  test("submitAnswer publishes event and updates presence", () => {
    mockGet.mockImplementation((_params: null, cb: (err: unknown, members: unknown[]) => void) =>
      cb(null, []),
    );

    const { result } = renderHook(() => useSharedQuiz("test-channel"));

    act(() => {
      result.current.submitAnswer("q1", true);
    });

    expect(mockPublish).toHaveBeenCalledWith("answer-submitted", {
      clientId: "user-1",
      questionId: "q1",
      correct: true,
    });
    expect(mockUpdate).toHaveBeenCalled();
  });

  test("setProgress updates presence data", () => {
    mockGet.mockImplementation((_params: null, cb: (err: unknown, members: unknown[]) => void) =>
      cb(null, []),
    );

    const { result } = renderHook(() => useSharedQuiz("test-channel"));

    act(() => {
      result.current.setProgress(5);
    });

    expect(result.current.currentUserProgress).toBe(5);
    expect(mockUpdate).toHaveBeenCalled();
  });

  test("completeQuiz publishes quiz-completed event", () => {
    mockGet.mockImplementation((_params: null, cb: (err: unknown, members: unknown[]) => void) =>
      cb(null, []),
    );

    const { result } = renderHook(() => useSharedQuiz("test-channel"));

    act(() => {
      result.current.completeQuiz();
    });

    expect(mockPublish).toHaveBeenCalledWith("quiz-completed", {
      clientId: "user-1",
      score: 0,
    });
  });
});
