import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { TierCard } from "../tier-card";
import { PRICING } from "@/lib/school/pricing";

describe("TierCard", () => {
  afterEach(cleanup);
  test("renders tier name and price", () => {
    render(
      <TierCard
        tierId="standard"
        tier={PRICING.standard}
        isCurrentPlan={false}
        onSelect={vi.fn()}
      />,
    );
    expect(screen.getByText("Standard")).toBeDefined();
    expect(screen.getByText(/R 50\/mo/)).toBeDefined();
  });

  test("renders features list", () => {
    render(<TierCard tierId="free" tier={PRICING.free} isCurrentPlan={false} onSelect={vi.fn()} />);
    expect(screen.getAllByText(/teacher seats included/).length).toBe(1);
    expect(screen.getByText(/AI questions/)).toBeDefined();
  });

  test("shows Current Plan when isCurrentPlan is true", () => {
    render(
      <TierCard tierId="premium" tier={PRICING.premium} isCurrentPlan={true} onSelect={vi.fn()} />,
    );
    expect(screen.getByText("Current Plan")).toBeDefined();
  });
});
