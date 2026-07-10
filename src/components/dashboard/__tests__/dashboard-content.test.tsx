import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// --- Mocks must be declared before the component import ---

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: { $id: "user-1", name: "Test User", labels: [] },
    status: "authenticated",
    isAnonymous: false,
  })),
}));

vi.mock("@/lib/services/notification-service", () => ({
  initializeNotificationSchedulers: vi.fn(),
}));

vi.mock("@/components/dashboard/anonymous-upsell", () => ({
  AnonymousUpsell: () => <div data-testid="anonymous-upsell" />,
}));

vi.mock("@/components/dashboard/countdown-header", () => ({
  CountdownHeader: () => <div data-testid="countdown-header" />,
}));

vi.mock("@/components/dashboard/dashboard-hero", () => ({
  HeroBanner: () => <div data-testid="hero-banner" />,
}));

vi.mock("@/components/dashboard/login-banner", () => ({
  LoginBanner: () => <div data-testid="login-banner" />,
}));

vi.mock("@/components/dashboard/today-tab", () => ({
  TodayTab: ({
    boltStreak,
    onBoltComplete,
  }: {
    boltStreak: number;
    onBoltComplete: (r: unknown) => void;
  }) => (
    <div data-testid="today-tab" data-streak={boltStreak}>
      <button type="button" onClick={() => onBoltComplete({ subject: "math", correct: true })}>
        Complete
      </button>
    </div>
  ),
}));

vi.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="page-container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/shared/pull-to-refresh", () => ({
  PullToRefresh: ({
    children,
    onRefresh: _onRefresh,
    ...rest
  }: {
    children: React.ReactNode;
    onRefresh: () => void;
    [k: string]: unknown;
  }) => (
    <div data-testid="pull-to-refresh" {...rest}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/shared/stagger-provider", () => ({
  StaggeredSection: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ className }: { className?: string }) => (
    <div data-testid="skeleton" className={className} />
  ),
}));

// next/dynamic: expose the loading skeleton immediately so we can verify
// the loading placeholders defined in dashboard-content.tsx
vi.mock("next/dynamic", () => ({
  default: (_loader: unknown, options?: { loading?: () => React.ReactNode; ssr?: boolean }) => {
    // Return a component that renders the loading state (the skeleton markup)
    const DynamicPlaceholder = () => (options?.loading ? options.loading() : null);
    DynamicPlaceholder.displayName = "DynamicPlaceholder";
    return DynamicPlaceholder;
  },
}));

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services";

const defaultProps = {
  onStartQuiz: vi.fn(),
  activeTab: "today" as const,
  onBoltComplete: vi.fn(),
  boltStreak: 0,
};

describe("DashboardContent", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("today tab", () => {
    it("renders HeroBanner on today tab", () => {
      const { getByTestId } = render(<DashboardContent {...defaultProps} />);
      expect(getByTestId("hero-banner")).toBeTruthy();
    });

    it("renders TodayTab on today tab", () => {
      const { getByTestId } = render(<DashboardContent {...defaultProps} />);
      expect(getByTestId("today-tab")).toBeTruthy();
    });

    it("renders CountdownHeader for logged-in user on today tab", () => {
      const { getByTestId } = render(<DashboardContent {...defaultProps} />);
      expect(getByTestId("countdown-header")).toBeTruthy();
    });

    it("does not render CountdownHeader for anonymous user", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { $id: "anon-1", name: null, labels: ["anonymous"] },
        status: "authenticated",
        isAnonymous: true,
      } as ReturnType<typeof useAuth>);

      const { queryByTestId } = render(<DashboardContent {...defaultProps} />);
      expect(queryByTestId("countdown-header")).toBeNull();
    });
  });

  describe("practice tab", () => {
    it("does not render HeroBanner on practice tab (only active tab mounts)", () => {
      const { queryByTestId } = render(<DashboardContent {...defaultProps} activeTab="practice" />);
      expect(queryByTestId("hero-banner")).toBeNull();
    });

    it("renders practice tab loading skeleton (dynamic import placeholder)", () => {
      const { getAllByTestId } = render(
        <DashboardContent {...defaultProps} activeTab="practice" />,
      );
      const skeletons = getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not render TodayTab on practice tab (only active tab mounts)", () => {
      const { queryByTestId } = render(<DashboardContent {...defaultProps} activeTab="practice" />);
      expect(queryByTestId("today-tab")).toBeNull();
    });

    it("renders practice tab loading skeleton (dynamic import placeholder)", () => {
      const { getAllByTestId } = render(
        <DashboardContent {...defaultProps} activeTab="practice" />,
      );
      // The dynamic PracticeTab renders its loading skeleton
      const skeletons = getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("shows AnonymousUpsell for anonymous user on practice tab", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { $id: "anon-1", name: null, labels: ["anonymous"] },
        status: "authenticated",
        isAnonymous: true,
      } as ReturnType<typeof useAuth>);

      const { getByTestId } = render(<DashboardContent {...defaultProps} activeTab="practice" />);
      expect(getByTestId("anonymous-upsell")).toBeTruthy();
    });

    it("does not show AnonymousUpsell for authenticated user on practice tab", () => {
      const { queryByTestId } = render(<DashboardContent {...defaultProps} activeTab="practice" />);
      expect(queryByTestId("anonymous-upsell")).toBeNull();
    });
  });

  describe("analytics tab", () => {
    it("renders analytics tab loading skeleton (dynamic import placeholder)", () => {
      const { getAllByTestId } = render(
        <DashboardContent {...defaultProps} activeTab="analytics" />,
      );
      const skeletons = getAllByTestId("skeleton");
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not render TodayTab on analytics tab (only active tab mounts)", () => {
      const { queryByTestId } = render(
        <DashboardContent {...defaultProps} activeTab="analytics" />,
      );
      expect(queryByTestId("today-tab")).toBeNull();
    });

    it("shows AnonymousUpsell for anonymous user on analytics tab", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { $id: "anon-1", name: null, labels: ["anonymous"] },
        status: "authenticated",
        isAnonymous: true,
      } as ReturnType<typeof useAuth>);

      const { getByTestId } = render(<DashboardContent {...defaultProps} activeTab="analytics" />);
      expect(getByTestId("anonymous-upsell")).toBeTruthy();
    });
  });

  describe("anonymous user", () => {
    beforeEach(() => {
      vi.mocked(useAuth).mockReturnValue({
        user: { $id: "anon-1", name: null, labels: ["anonymous"] },
        status: "authenticated",
        isAnonymous: true,
      } as ReturnType<typeof useAuth>);
    });

    it("renders LoginBanner for anonymous user", () => {
      const { getByTestId } = render(<DashboardContent {...defaultProps} />);
      expect(getByTestId("login-banner")).toBeTruthy();
    });
  });

  describe("notification schedulers", () => {
    it("calls initializeNotificationSchedulers when logged in", () => {
      render(<DashboardContent {...defaultProps} />);
      expect(initializeNotificationSchedulers).toHaveBeenCalled();
    });

    it("does not call initializeNotificationSchedulers for anonymous user", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: { $id: "anon-1", name: null, labels: ["anonymous"] },
        status: "authenticated",
        isAnonymous: true,
      } as ReturnType<typeof useAuth>);

      render(<DashboardContent {...defaultProps} />);
      expect(initializeNotificationSchedulers).not.toHaveBeenCalled();
    });

    it("does not call initializeNotificationSchedulers when user is null", () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        status: "unauthenticated",
        isAnonymous: false,
      } as ReturnType<typeof useAuth>);

      render(<DashboardContent {...defaultProps} />);
      expect(initializeNotificationSchedulers).not.toHaveBeenCalled();
    });
  });

  describe("practice tab loading skeleton structure", () => {
    it("renders the correct number of skeletons for practice tab loading state", () => {
      // With conditional rendering, only the active tab renders
      // Practice tab: 1 large + 2 grid + 1 bottom = 4
      const { getAllByTestId } = render(
        <DashboardContent {...defaultProps} activeTab="practice" />,
      );
      const skeletons = getAllByTestId("skeleton");
      expect(skeletons.length).toBe(4);
    });

    it("renders the correct number of skeletons for analytics tab loading state", () => {
      // Analytics tab: 3 grid + 1 medium + 1 large = 5
      const { getAllByTestId } = render(
        <DashboardContent {...defaultProps} activeTab="analytics" />,
      );
      const skeletons = getAllByTestId("skeleton");
      expect(skeletons.length).toBe(5);
    });
  });

  describe("id prop", () => {
    it("passes id to PullToRefresh", () => {
      const { getByTestId } = render(<DashboardContent {...defaultProps} id="scroll-container" />);
      const ptr = getByTestId("pull-to-refresh");
      expect(ptr.getAttribute("id")).toBe("scroll-container");
    });
  });
});
