import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { CommitmentList } from "@/components/study-buddies/commitment-list";
import type { Commitment } from "@/hooks/use-study-buddies";

vi.mock("@/components/study-buddies/commitment-card", () => ({
  CommitmentCard: ({ commitment }: { commitment: Commitment }) => (
    <span>{commitment.buddyName}</span>
  ),
}));

function hasText(container: HTMLElement, regex: RegExp): boolean {
  return regex.test(container.textContent ?? "");
}

const base: Omit<Commitment, "status"> = {
  id: 1,
  buddyUserId: "u1",
  buddyName: "Alice",
  subject: "Math",
  createdAt: "2026-07-01",
};

describe("CommitmentList", () => {
  afterEach(cleanup);

  test("renders empty state when no commitments", () => {
    const { container } = render(<CommitmentList commitments={[]} loading={false} />);
    expect(hasText(container, /No study commitments yet/)).toBe(true);
  });

  test("renders loading message when loading", () => {
    const { container } = render(<CommitmentList commitments={[]} loading={true} />);
    expect(hasText(container, /Loading commitments/)).toBe(true);
  });

  test("groups commitments by status", () => {
    const commitments: Commitment[] = [
      { ...base, id: 1, buddyName: "Alice", status: "pending" },
      { ...base, id: 2, buddyName: "Bob", status: "active" },
      { ...base, id: 3, buddyName: "Carol", status: "completed" },
    ];
    const { container } = render(<CommitmentList commitments={commitments} loading={false} />);
    expect(hasText(container, /Pending/)).toBe(true);
    expect(hasText(container, /Active/)).toBe(true);
    expect(hasText(container, /History/)).toBe(true);
    expect(hasText(container, /Alice/)).toBe(true);
    expect(hasText(container, /Bob/)).toBe(true);
    expect(hasText(container, /Carol/)).toBe(true);
  });
});
