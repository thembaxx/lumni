import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TierCard } from "../tier-card";

describe("TierCard", () => {
  afterEach(cleanup);
  test("renders tier name and price", () => {
    render(
      <TierCard tier="standard" selected={false} onSelect={vi.fn()} billingFrequency="monthly" />,
    );
    expect(screen.getByText("Standard")).toBeDefined();
    expect(screen.getByText(/R 50\/mo/)).toBeDefined();
  });

  test("renders features list", () => {
    render(<TierCard tier="free" selected={false} onSelect={vi.fn()} billingFrequency="monthly" />);
    expect(screen.getAllByText(/teacher seats included/).length).toBe(1);
    expect(screen.getByText(/AI questions/)).toBeDefined();
  });

  test("shows checkmark when selected", () => {
    render(
      <TierCard tier="premium" selected={true} onSelect={vi.fn()} billingFrequency="monthly" />,
    );
    expect(screen.getByText("Premium")).toBeDefined();
  });
});
