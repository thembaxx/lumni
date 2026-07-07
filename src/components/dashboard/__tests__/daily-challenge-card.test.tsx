import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockPush = vi.fn();

vi.mock("@/hooks/use-navigation-direction", () => ({
  useNavigationDirection: () => ({ push: mockPush }),
}));

const mockUseGamification = vi.fn(() => ({
  gamification: { lastPracticeDate: "2026-06-16" },
}));

vi.mock("@/hooks/use-gamification", () => ({
  useGamification: (...args: unknown[]) => mockUseGamification(...args),
}));

vi.mock("@/contexts/gamification-provider", () => ({
  useGamificationContext: (...args: unknown[]) => mockUseGamification(...args),
  GamificationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/components/dashboard/countdown-header", () => ({
  CountdownHeader: () => null,
}));

import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";

const defaultProps = { streak: 1 };

describe("DailyChallengeCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGamification.mockReturnValue({
      gamification: { lastPracticeDate: "2026-06-16" },
    });
  });

  it("renders heading", () => {
    const { container } = render(<DailyChallengeCard {...defaultProps} />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/Today/);
    expect(text).toMatch(/Challenge/);
  });

  it("renders 'Take Challenge' button", () => {
    render(<DailyChallengeCard {...defaultProps} />);
    const buttons = screen.getAllByRole("button", { name: /take challenge/i });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  it("hides card after completion", () => {
    mockUseGamification.mockReturnValue({
      gamification: { lastPracticeDate: new Date().toDateString() },
    });
    const { container } = render(<DailyChallengeCard {...defaultProps} />);
    expect(container.querySelector('[data-slot="card"]')).toBeNull();
  });

  it("renders streak badge when streak > 1", () => {
    const { container } = render(<DailyChallengeCard streak={5} />);
    const text = container.textContent ?? "";
    expect(text).toMatch(/5x/);
  });
});
