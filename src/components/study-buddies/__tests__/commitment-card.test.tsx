import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CommitmentCard } from "@/components/study-buddies/commitment-card";

const baseCommitment = {
  id: 1,
  buddyUserId: "u1",
  buddyName: "Alice",
  subject: "Math",
  createdAt: "2026-07-01",
};

describe("CommitmentCard", () => {
  afterEach(cleanup);

  test("renders with pending status and action buttons", () => {
    const onAccept = vi.fn();
    const onDecline = vi.fn();
    render(
      <CommitmentCard
        commitment={{ ...baseCommitment, status: "pending" }}
        onAccept={onAccept}
        onDecline={onDecline}
      />,
    );
    expect(screen.getByText("Alice")).toBeDefined();
    expect(screen.getByText("pending")).toBeDefined();
    expect(screen.getByText("Subject: Math")).toBeDefined();
    expect(screen.getByText("Accept")).toBeDefined();
    expect(screen.getByText("Decline")).toBeDefined();
  });

  test("renders with active status and complete button", () => {
    render(
      <CommitmentCard
        commitment={{ ...baseCommitment, status: "active", targetDailyMinutes: 30 }}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByText("active")).toBeDefined();
    expect(screen.getByText("Complete")).toBeDefined();
    expect(screen.getByText(/30 min\/day/)).toBeDefined();
  });

  test("renders with completed status and no action buttons", () => {
    render(<CommitmentCard commitment={{ ...baseCommitment, status: "completed" }} />);
    expect(screen.getByText("completed")).toBeDefined();
    expect(screen.queryByText("Accept")).toBeNull();
    expect(screen.queryByText("Decline")).toBeNull();
    expect(screen.queryByText("Complete")).toBeNull();
  });
});
