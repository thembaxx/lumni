import { fireEvent, render } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

const mockToast = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => mockToast,
}));

const mockWriteText = vi.fn();
Object.defineProperty(navigator, "clipboard", {
  value: { writeText: mockWriteText },
  writable: true,
  configurable: true,
});

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownList: ({
    children,
    onOpenChange,
  }: {
    children: React.ReactNode;
    onOpenChange?: (v: boolean) => void;
  }) => (
    <div data-testid="mock-dropdown">
      {children}
      <button data-testid="mock-close" aria-label="Close" onClick={() => onOpenChange?.(false)} />
    </div>
  ),
  DropdownListContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-content">{children}</div>
  ),
  DropdownListItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button data-testid="mock-item" onClick={onClick} type="button">
      {children}
    </button>
  ),
  DropdownListTrigger: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-trigger">{children}</div>
  ),
}));

const { InviteButton } = await import("@/components/study-groups/invite-button");

describe("InviteButton", () => {
  test("renders the button", () => {
    const { container } = render(
      <InviteButton channelName="test-chan" inviteCode="ABC123" subject="Mathematics" />,
    );

    expect(container.textContent).toContain("Study Together");
  });

  test("renders dropdown items with invite code and share link", () => {
    const { container } = render(
      <InviteButton channelName="test-chan" inviteCode="XYZ789" subject="Mathematics" />,
    );

    expect(container.textContent).toContain("Copy invite code");
    expect(container.textContent).toContain("Copy share link");
    expect(container.textContent).toContain("XYZ789");
  });

  test("copies invite code when clicked", () => {
    const { container } = render(
      <InviteButton channelName="test-chan" inviteCode="CODE42" subject="Mathematics" />,
    );

    const items = container.querySelectorAll('[data-testid="mock-item"]');
    expect(items.length).toBeGreaterThanOrEqual(1);
    fireEvent.click(items[0]);

    expect(mockWriteText).toHaveBeenCalledWith("CODE42");
  });
});
