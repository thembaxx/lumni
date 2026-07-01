import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ConfirmDialog } from "../confirm-dialog";

afterEach(cleanup);

describe("ConfirmDialog", () => {
  const defaultProps = {
    open: true,
    title: "Delete item?",
    description: "This action cannot be undone.",
    confirmLabel: "Delete",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  test("renders title", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete item?")).toBeDefined();
  });

  test("renders description via DialogDescription", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("This action cannot be undone.")).toBeDefined();
  });

  test("renders confirm and cancel buttons", () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText("Delete")).toBeDefined();
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  test("renders custom cancel label", () => {
    render(<ConfirmDialog {...defaultProps} cancelLabel="Back" />);
    expect(screen.getByText("Back")).toBeDefined();
  });

  test("does not render when closed", () => {
    render(<ConfirmDialog {...defaultProps} open={false} />);
    expect(screen.queryByText("Delete item?")).toBeNull();
  });
});
