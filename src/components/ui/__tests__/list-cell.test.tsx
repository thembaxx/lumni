import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LabelledSwitch } from "../labelled-switch";
import { ListCell } from "../list-cell";

afterEach(cleanup);

describe("ListCell", () => {
  test("renders title and subtitle", () => {
    render(<ListCell title="User Profile" subtitle="Manage your personal details" />);
    expect(screen.getByText("User Profile")).toBeDefined();
    expect(screen.getByText("Manage your personal details")).toBeDefined();
  });

  test("renders leading content when provided", () => {
    render(<ListCell title="Share ID" leading={<span data-testid="leading-icon">Icon</span>} />);
    expect(screen.getByTestId("leading-icon")).toBeDefined();
    expect(screen.getByText("Icon")).toBeDefined();
  });

  test("renders trailing content when provided", () => {
    render(
      <ListCell
        title="Notifications"
        trailing={<span data-testid="trailing-badge">Active</span>}
      />,
    );
    expect(screen.getByTestId("trailing-badge")).toBeDefined();
  });
});

describe("LabelledSwitch", () => {
  test("renders switch with title as aria-label by default", () => {
    render(<LabelledSwitch title="Enable Reminders" checked={false} onCheckedChange={vi.fn()} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDefined();
    expect(switchElement.getAttribute("aria-label")).toBe("Enable Reminders");
  });

  test("allows custom aria-label override", () => {
    render(
      <LabelledSwitch
        title="Enable Reminders"
        aria-label="Custom Reminder Toggle"
        checked={true}
        onCheckedChange={vi.fn()}
      />,
    );

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDefined();
    expect(switchElement.getAttribute("aria-label")).toBe("Custom Reminder Toggle");
  });
});
