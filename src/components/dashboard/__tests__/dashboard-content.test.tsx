import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

vi.mock("next-intl/navigation", () => {
  const createNavigation = () => ({
    usePathname: () => "/dashboard",
    useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
    Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
      <a href={href}>{children}</a>
    ),
    redirect: (url: string) => url,
  });
  return { createNavigation };
});

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

vi.mock("@/components/dashboard/login-banner", () => ({
  LoginBanner: () => <div data-testid="login-banner" />,
}));

vi.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="page-container" className={className}>
      {children}
    </div>
  ),
}));

vi.mock("@/components/dashboard/dashboard-view", () => ({
  DashboardView: ({ boltStreak }: { boltStreak: number }) => (
    <div data-testid="dashboard-view" data-streak={boltStreak} />
  ),
}));

import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services";

const defaultProps = {
  onStartQuiz: vi.fn(),
  boltStreak: 0,
};

describe("DashboardContent", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it("renders LoginBanner", () => {
    const { getByTestId } = render(<DashboardContent {...defaultProps} />);
    expect(getByTestId("login-banner")).toBeTruthy();
  });

  it("renders DashboardView", () => {
    const { getByTestId } = render(<DashboardContent {...defaultProps} />);
    expect(getByTestId("dashboard-view")).toBeTruthy();
  });

  it("passes boltStreak to DashboardView", () => {
    const { getByTestId } = render(<DashboardContent {...defaultProps} boltStreak={5} />);
    expect(getByTestId("dashboard-view").getAttribute("data-streak")).toBe("5");
  });

  it("passes id to root element", () => {
    const { container } = render(<DashboardContent {...defaultProps} id="dashboard-content" />);
    const root = container.firstChild as HTMLElement;
    expect(root.getAttribute("id")).toBe("dashboard-content");
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
});
