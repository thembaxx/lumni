import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mock all heavy dependencies before importing the component ---

vi.mock("@/lib/auth/auth-context", () => ({
	useAuth: vi.fn(() => ({
		user: { $id: "user-1", name: "Test User", labels: [] },
		status: "authenticated",
		isAnonymous: false,
	})),
}));

vi.mock("@/components/shared/stagger-provider", () => ({
	StaggerProvider: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	StaggeredSection: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@/components/ui/skeleton", () => ({
	Skeleton: ({ className }: { className?: string }) => (
		<div data-testid="skeleton" className={className} />
	),
}));

vi.mock("@/components/ui/card", () => ({
	Card: ({ children }: { children: React.ReactNode }) => (
		<div data-slot="card">{children}</div>
	),
	CardContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	CardHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	CardTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

// Mock all dynamic sub-components to avoid loading heavy modules
vi.mock("@/components/dashboard/analytics/comparative-analytics-panel", () => ({
	ComparativeAnalyticsPanel: () => (
		<div data-testid="comparative-analytics-panel" />
	),
}));

vi.mock("@/components/dashboard/stats-row", () => ({
	StatsRow: () => <div data-testid="stats-row" />,
}));

vi.mock("@/components/social/leaderboard-card", () => ({
	LeaderboardCard: () => <div data-testid="leaderboard-card" />,
}));

vi.mock("@/components/dashboard/achievement-showcase", () => ({
	AchievementShowcase: () => <div data-testid="achievement-showcase" />,
}));

vi.mock("@/components/gamification/reward-chest/reward-chest-panel", () => ({
	RewardChestPanel: () => <div data-testid="reward-chest-panel" />,
}));

vi.mock("@/components/dashboard/mastery-heatmap", () => ({
	MasteryHeatmap: () => <div data-testid="mastery-heatmap" />,
}));

// next/dynamic: render the module's loading state by default; the module mock
// overrides the actual component so dynamic just passes it through.
vi.mock("next/dynamic", () => ({
	default: (
		_loader: () => Promise<{ default: React.ComponentType }>,
		options?: { loading?: () => React.ReactNode },
	) => {
		// Return a component that renders the loader result synchronously via the
		// mock module (which are already resolved synchronously by Vitest's mock).
		// We return a wrapper that React can render.
		const LazyComp = (_props: Record<string, unknown>) => {
			// The mocks make each module available synchronously, so we just use
			// the loading placeholder if provided, otherwise a simple div.
			return options?.loading ? (
				options.loading()
			) : (
				<div data-testid="dynamic-placeholder" />
			);
		};
		return LazyComp;
	},
}));

import { AnalyticsTab } from "@/components/dashboard/analytics-tab";
import { useAuth } from "@/lib/auth/auth-context";

function createMockIntersectionObserver(
	triggerImmediately: boolean,
): typeof IntersectionObserver {
	return vi.fn(function (
		this: IntersectionObserver,
		callback: IntersectionObserverCallback,
	) {
		const instance = {
			observe: vi.fn((el: Element) => {
				if (triggerImmediately) {
					act(() => {
						callback(
							[
								{
									isIntersecting: true,
									target: el,
								} as IntersectionObserverEntry,
							],
							instance as unknown as IntersectionObserver,
						);
					});
				}
			}),
			disconnect: vi.fn(),
			unobserve: vi.fn(),
			takeRecords: vi.fn(() => []),
			root: null,
			rootMargin: "",
			thresholds: [],
		};
		return instance;
	}) as unknown as typeof IntersectionObserver;
}

describe("AnalyticsTab", () => {
	const originalIntersectionObserver = globalThis.IntersectionObserver;

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		globalThis.IntersectionObserver = originalIntersectionObserver;
	});

	describe("when user is not logged in", () => {
		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({
				user: null,
				status: "unauthenticated",
				isAnonymous: false,
			} as ReturnType<typeof useAuth>);
		});

		it("renders nothing when user is null", () => {
			const { container } = render(<AnalyticsTab />);
			expect(container.firstChild).toBeNull();
		});
	});

	describe("when user is logged in", () => {
		beforeEach(() => {
			vi.mocked(useAuth).mockReturnValue({
				user: { $id: "user-1", name: "Test User", labels: [] },
				status: "authenticated",
				isAnonymous: false,
			} as ReturnType<typeof useAuth>);
		});

		it("renders the analytics tab container", () => {
			globalThis.IntersectionObserver = createMockIntersectionObserver();
			const { container } = render(<AnalyticsTab />);
			expect(container.firstChild).not.toBeNull();
		});

		it("registers IntersectionObserver for lazy sections", () => {
			const MockObserver = createMockIntersectionObserver();
			globalThis.IntersectionObserver = MockObserver;

			render(<AnalyticsTab />);

			// Should have created IntersectionObserver instances for lazy sections
			expect(MockObserver).toHaveBeenCalled();
		});

		it("shows skeleton placeholders before intersection in lazy sections", () => {
			// Observer that never triggers intersection
			globalThis.IntersectionObserver = createMockIntersectionObserver(false);

			const { getAllByTestId } = render(<AnalyticsTab />);
			const skeletons = getAllByTestId("skeleton");
			// At least 2 lazy sections: LeaderboardCard and MasteryHeatmap card
			expect(skeletons.length).toBeGreaterThanOrEqual(2);
		});
	});
});

describe("LazySection behavior via AnalyticsTab", () => {
	const originalIntersectionObserver = globalThis.IntersectionObserver;

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		globalThis.IntersectionObserver = originalIntersectionObserver;
	});

	beforeEach(() => {
		vi.mocked(useAuth).mockReturnValue({
			user: { $id: "user-1", name: "Test User", labels: [] },
			status: "authenticated",
			isAnonymous: false,
		} as ReturnType<typeof useAuth>);
	});

	it("disconnects observer after becoming visible", () => {
		const disconnectSpy = vi.fn();

		let capturedCallback: IntersectionObserverCallback = () => {};
		// biome-ignore lint/complexity/useArrowFunction: must be regular function for constructor usage
		globalThis.IntersectionObserver = function (
			cb: IntersectionObserverCallback,
			_options?: IntersectionObserverInit,
		) {
			capturedCallback = cb;
			const instance: IntersectionObserver = {
				observe: vi.fn((el: Element) => {
					act(() => {
						capturedCallback(
							[
								{
									isIntersecting: true,
									target: el,
								} as IntersectionObserverEntry,
							],
							instance,
						);
					});
				}),
				disconnect: disconnectSpy,
				unobserve: vi.fn(),
				takeRecords: vi.fn(() => []),
				root: null,
				rootMargin: "",
				thresholds: [],
			};
			return instance;
		} as unknown as typeof IntersectionObserver;

		render(<AnalyticsTab />);

		expect(disconnectSpy).toHaveBeenCalled();
	});

	it("does not show children before intersection is triggered", () => {
		// Observer that never calls back
		// biome-ignore lint/complexity/useArrowFunction: must be regular function for constructor usage
		globalThis.IntersectionObserver = function (
			_cb: IntersectionObserverCallback,
			_options?: IntersectionObserverInit,
		) {
			return {
				observe: vi.fn(),
				disconnect: vi.fn(),
				unobserve: vi.fn(),
				takeRecords: vi.fn(() => []),
				root: null,
				rootMargin: "",
				thresholds: [],
			} as unknown as IntersectionObserver;
		} as unknown as typeof IntersectionObserver;

		const { queryByTestId } = render(<AnalyticsTab />);

		expect(queryByTestId("leaderboard-card")).toBeNull();
		expect(queryByTestId("mastery-heatmap")).toBeNull();
	});

	it("creates IntersectionObserver with 200px rootMargin", () => {
		const capturedOptions: IntersectionObserverInit[] = [];
		// biome-ignore lint/complexity/useArrowFunction: must be regular function for constructor usage
		globalThis.IntersectionObserver = function (
			_cb: IntersectionObserverCallback,
			options?: IntersectionObserverInit,
		) {
			if (options) capturedOptions.push(options);
			return {
				observe: vi.fn(),
				disconnect: vi.fn(),
				unobserve: vi.fn(),
				takeRecords: vi.fn(() => []),
				root: null,
				rootMargin: "",
				thresholds: [],
			} as unknown as IntersectionObserver;
		} as unknown as typeof IntersectionObserver;

		render(<AnalyticsTab />);

		expect(capturedOptions.length).toBeGreaterThan(0);
		for (const opts of capturedOptions) {
			expect(opts.rootMargin).toBe("200px");
		}
	});
});
