import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockEnter = vi.fn();
const mockLeave = vi.fn();
const mockUpdate = vi.fn();
let mockPresenceData: unknown[] = [];
let mockUsePresenceEnterLeave = { autoEnterLeave: false };

vi.mock("@ably/chat/react", () => ({
  ChatRoomProvider: ({ children }: { children: React.ReactNode }) => children,
  usePresence: vi.fn(() => {
    const ret: { enter: typeof mockEnter; leave: typeof mockLeave; update: typeof mockUpdate } = {
      enter: mockEnter,
      leave: mockLeave,
      update: mockUpdate,
    };
    Object.assign(ret, mockUsePresenceEnterLeave);
    return ret;
  }),
  usePresenceListener: vi.fn(() => ({ presenceData: mockPresenceData })),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("motion/react-m", () => ({
  div: ({ children, ...rest }: { children: React.ReactNode; [k: string]: unknown }) => (
    <div {...rest}>{children}</div>
  ),
}));

const mockStartSession = vi.fn<(subject?: string) => Promise<unknown>>();
let mockSession: unknown = null;
let mockIsLoading = false;
let mockIsStarting = false;

vi.mock("@/hooks/use-live-session", () => ({
  useLiveSession: vi.fn(() => ({
    session: mockSession,
    isLoading: mockIsLoading,
    startSession: mockStartSession,
    isStarting: mockIsStarting,
  })),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: { $id: "user-1", name: "Test User" },
  })),
}));

vi.mock("@/components/ui/avatar", () => ({
  Avatar: ({ children, ...props }: Record<string, unknown>) => (
    <div {...props} data-testid="avatar">
      {children}
    </div>
  ),
  AvatarFallback: ({ children, ...props }: Record<string, unknown>) => (
    <span {...props} data-testid="avatar-fallback">
      {children}
    </span>
  ),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }: Record<string, unknown>) => (
    <button type="button" onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children, value, onValueChange }: Record<string, unknown>) => (
    <select
      value={value as string}
      onChange={(e) => onValueChange?.(e.target.value)}
      data-testid="activity-select"
    >
      {children}
    </select>
  ),
  SelectContent: ({ children }: Record<string, unknown>) => children,
  SelectItem: ({ children, value }: Record<string, unknown>) => (
    <option value={value as string}>{children}</option>
  ),
  SelectTrigger: ({ children }: Record<string, unknown>) => children,
  SelectValue: () => null,
}));

vi.mock("@/components/ui/skeleton", () => ({
  Skeleton: ({ ...props }: Record<string, unknown>) => <div {...props} data-testid="skeleton" />,
}));

const mockApiFetch = vi.fn();

vi.mock("@/lib/shared/api-fetch", () => ({
  apiFetch: mockApiFetch,
}));

const { LiveSessionBar } = await import("../live-session-bar");

function renderBar(groupId = "group-1") {
  return render(<LiveSessionBar groupId={groupId} />);
}

describe("LiveSessionBar", () => {
  beforeEach(() => {
    mockEnter.mockReset();
    mockLeave.mockReset();
    mockUpdate.mockReset();
    mockPresenceData = [];
    mockStartSession.mockReset();
    mockStartSession.mockResolvedValue(undefined);
    mockSession = null;
    mockIsLoading = false;
    mockIsStarting = false;
    mockApiFetch.mockReset();
  });

  afterEach(cleanup);

  describe("loading state", () => {
    it("renders skeleton when isLoading is true", () => {
      mockIsLoading = true;
      const { container } = renderBar();
      const skeletons = container.querySelectorAll("[data-testid='skeleton']");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("no active session", () => {
    it("shows Study Session heading", () => {
      renderBar();
      expect(screen.getByText("Study Session")).toBeDefined();
    });

    it("shows Start Live button", () => {
      renderBar();
      expect(screen.getByText("Start Live")).toBeDefined();
    });

    it("calls startSession on Start Live click", async () => {
      renderBar();
      fireEvent.click(screen.getByText("Start Live"));
      expect(mockStartSession).toHaveBeenCalledTimes(1);
    });

    it("disables Start Live button when isStarting", () => {
      mockIsStarting = true;
      renderBar();
      const btn = screen.getByText("Start Live") as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  describe("active session — not a participant", () => {
    beforeEach(() => {
      mockSession = {
        $id: "session-1",
        groupId: "group-1",
        startedBy: "user-2",
        startedByName: "Bob",
        status: "active",
        startedAt: new Date().toISOString(),
      };
      mockPresenceData = [
        { clientId: "user-2", data: { userName: "Bob", currentActivity: "Studying" } },
      ];
    });

    it("shows Live Session heading with participant count", () => {
      renderBar();
      expect(screen.getByText("Live Session")).toBeDefined();
      expect(screen.getByText("1 participant")).toBeDefined();
    });

    it("shows started by name when current user is not the starter", () => {
      renderBar();
      expect(screen.getByText(/Started by Bob/)).toBeDefined();
    });

    it("shows Join Session button", () => {
      renderBar();
      expect(screen.getByText("Join Session")).toBeDefined();
    });

    it("calls enter with user data on Join click", () => {
      renderBar();
      fireEvent.click(screen.getByText("Join Session"));
      expect(mockEnter).toHaveBeenCalledWith({
        userId: "user-1",
        userName: "Test User",
        currentActivity: "Studying",
      });
    });
  });

  describe("active session — participant", () => {
    beforeEach(() => {
      mockSession = {
        $id: "session-1",
        groupId: "group-1",
        startedBy: "user-1",
        startedByName: "Test User",
        status: "active",
        startedAt: new Date().toISOString(),
      };
      mockPresenceData = [
        { clientId: "user-1", data: { userName: "Test User", currentActivity: "Studying" } },
      ];
    });

    it("shows participant count for multiple participants", () => {
      mockPresenceData = [
        { clientId: "user-1", data: { userName: "Test User", currentActivity: "Studying" } },
        { clientId: "user-2", data: { userName: "Bob", currentActivity: "Reviewing" } },
      ];
      renderBar();
      expect(screen.getByText("2 participants")).toBeDefined();
    });

    it("does not show started by when current user is the starter", () => {
      renderBar();
      expect(screen.queryByText(/Started by/)).toBeNull();
    });

    it("shows Leave button", () => {
      renderBar();
      expect(screen.getByText("Leave")).toBeDefined();
    });

    it("calls leave on Leave click", () => {
      renderBar();
      fireEvent.click(screen.getByText("Leave"));
      expect(mockLeave).toHaveBeenCalledTimes(1);
    });

    it("shows activity selector with current activity", () => {
      renderBar();
      const select = screen.getByTestId("activity-select") as HTMLSelectElement;
      expect(select).toBeDefined();
      expect(select.value).toBe("Studying");
    });

    it("calls update on activity change", () => {
      renderBar();
      const select = screen.getByTestId("activity-select") as HTMLSelectElement;
      fireEvent.change(select, { target: { value: "Reviewing" } });
      expect(mockUpdate).toHaveBeenCalledWith({
        userId: "user-1",
        userName: "Test User",
        currentActivity: "Reviewing",
      });
    });
  });

  describe("auto-end on unmount", () => {
    it("calls endSessionOnServer when last participant unmounts", async () => {
      mockSession = {
        $id: "session-1",
        groupId: "group-1",
        startedBy: "user-2",
        startedByName: "Bob",
        status: "active",
        startedAt: new Date().toISOString(),
      };
      mockPresenceData = [{ clientId: "user-1", data: { userName: "Test User" } }];

      const { unmount } = renderBar();
      unmount();

      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/study-groups/group-1/live-session/session-1",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("end"),
        }),
      );
    });

    it("does not call endSessionOnServer when other participants exist", async () => {
      mockSession = {
        $id: "session-1",
        groupId: "group-1",
        startedBy: "user-2",
        startedByName: "Bob",
        status: "active",
        startedAt: new Date().toISOString(),
      };
      mockPresenceData = [
        { clientId: "user-1", data: { userName: "Test User" } },
        { clientId: "user-2", data: { userName: "Bob" } },
      ];

      const { unmount } = renderBar();
      unmount();

      expect(mockApiFetch).not.toHaveBeenCalledWith(
        expect.stringContaining("live-session"),
        expect.anything(),
      );
    });

    it("always calls leave on unmount", async () => {
      mockSession = {
        $id: "session-1",
        groupId: "group-1",
        startedBy: "user-2",
        status: "active",
        startedAt: new Date().toISOString(),
      };
      mockPresenceData = [{ clientId: "user-1", data: { userName: "Test User" } }];

      const { unmount } = renderBar();
      unmount();

      expect(mockLeave).toHaveBeenCalledTimes(1);
    });
  });
});
