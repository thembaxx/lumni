import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockUseGamification = vi.fn(() => ({
	gamification: { lastPracticeDate: "2026-06-16" },
}));

vi.mock("@/hooks/use-gamification", () => ({
	useGamification: (...args: unknown[]) => mockUseGamification(...args),
}));

vi.mock("@/components/dashboard/daily-challenge-dialog", () => ({
	DailyChallengeDialog: ({ onClose }: { onClose: () => void }) => (
		<div data-testid="dialog">
			<button type="button" onClick={onClose}>Close</button>
		</div>
	),
	resolveWeakestSubject: vi.fn(() => "mathematics"),
}));

vi.mock("@/components/ui/challenge-dialog", () => ({
	ChallengeDialog: ({
		children,
		open,
	}: {
		children: React.ReactNode;
		open: boolean;
	}) => (open ? <div data-testid="portal">{children}</div> : null),
}));

vi.mock("@/components/dashboard/dashboard-timer-provider", () => ({
	useDashboardTimer: vi.fn(() => ({ showTimer: false })),
}));

vi.mock("@/hooks/use-question-engine", () => ({
	useQuestionEngine: vi.fn(() => ({
		generate: vi.fn(),
		questions: [],
		isLoading: false,
		error: null,
	})),
}));

vi.mock("@/hooks/use-sm2", () => ({
	useSM2Session: vi.fn(() => ({
		startSession: vi.fn(),
		isLoading: false,
	})),
}));

vi.mock("@/components/dashboard/countdown-header", () => ({
	CountdownHeader: () => null,
}));

import { DailyChallengeCard } from "@/components/dashboard/daily-challenge-card";

const defaultProps = {
	onComplete: vi.fn(),
	streak: 1,
};

describe("DailyChallengeCard", () => {
	beforeEach(() => {
		mockUseGamification.mockReturnValue({
			gamification: { lastPracticeDate: "2026-06-16" },
		});
	});
	it("renders heading and subject", () => {
		const { container } = render(<DailyChallengeCard {...defaultProps} />);
		const text = container.textContent ?? "";
		expect(text).toMatch(/Today/);
		expect(text).toMatch(/Challenge/);
		expect(text).toMatch(/Mathematics/);
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
		const { container } = render(
			<DailyChallengeCard onComplete={vi.fn()} streak={5} />,
		);
		const text = container.textContent ?? "";
		expect(text).toMatch(/5x/);
	});
});
