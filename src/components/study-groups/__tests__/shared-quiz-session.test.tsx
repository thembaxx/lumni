import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

vi.mock("@/hooks/use-shared-quiz", () => ({
  useSharedQuiz: vi.fn(),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: () => ({
    user: { $id: "user-1", name: "Alice" },
    authReady: true,
  }),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    if (key === "common.participants") return "{count} participants";
    return key;
  },
}));

const mockUseSharedQuiz = vi.mocked((await import("@/hooks/use-shared-quiz")).useSharedQuiz);

const { SharedQuizSession } = await import("@/components/study-groups/shared-quiz-session");

describe("SharedQuizSession", () => {
  test("renders nothing when no participants and not connected", () => {
    mockUseSharedQuiz.mockReturnValue({
      participants: [],
      isConnected: false,
      currentUserProgress: 0,
      submitAnswer: vi.fn(),
      setProgress: vi.fn(),
      completeQuiz: vi.fn(),
    });

    const { container } = render(<SharedQuizSession channelName="test" totalQuestions={10} />);

    expect(container.textContent).toBe("");
  });

  test("renders participants when present", () => {
    mockUseSharedQuiz.mockReturnValue({
      participants: [
        { userId: "user-1", userName: "Alice", score: 5, progress: 8 },
        { userId: "user-2", userName: "Bob", score: 3, progress: 6 },
      ],
      isConnected: true,
      currentUserProgress: 8,
      submitAnswer: vi.fn(),
      setProgress: vi.fn(),
      completeQuiz: vi.fn(),
    });

    render(<SharedQuizSession channelName="test" totalQuestions={10} />);

    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("Bob")).toBeDefined();
    expect(screen.getByText("Live")).toBeDefined();
  });

  test("marks current user with (you)", () => {
    mockUseSharedQuiz.mockReturnValue({
      participants: [
        { userId: "user-1", userName: "Alice", score: 5, progress: 8 },
        { userId: "user-2", userName: "Bob", score: 3, progress: 6 },
      ],
      isConnected: true,
      currentUserProgress: 8,
      submitAnswer: vi.fn(),
      setProgress: vi.fn(),
      completeQuiz: vi.fn(),
    });

    const { container } = render(<SharedQuizSession channelName="test" totalQuestions={10} />);

    expect(container.textContent).toContain("(you)");
  });
});
