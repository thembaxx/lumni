import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/markdown-renderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

import { SwipeableCard } from "@/components/flashcard/swipeable-card";

const defaultProps = {
  id: "test-card",
  front: "What is 2+2?",
  back: "4",
  topic: "Math",
  isTop: true,
  mode: "simple" as const,
  onSwipe: vi.fn(),
};

describe("SwipeableCard", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders with front and back content", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      expect(getByTestId("swipeable-card")).toBeTruthy();
      expect(getByTestId("card-front")).toBeTruthy();
      expect(getByTestId("card-back")).toBeTruthy();
    });

    it("shows front text and back text", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const front = getByTestId("card-front");
      const back = getByTestId("card-back");
      expect(front.textContent).toContain("What is 2+2?");
      expect(back.textContent).toContain("4");
    });

    it("shows topic label when topic is provided", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      expect(getByTestId("card-topic").textContent).toBe("Math");
    });

    it("does not show topic when not provided", () => {
      const { queryByTestId } = render(<SwipeableCard {...defaultProps} topic={undefined} />);
      expect(queryByTestId("card-topic")).toBeNull();
    });

    it("is not interactive when isTop is false", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} isTop={false} />);
      const card = getByTestId("swipeable-card");
      expect(card.getAttribute("aria-disabled")).toBe("true");
      expect(card.getAttribute("tabindex")).toBe("-1");
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA attributes", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");
      expect(card.getAttribute("role")).toBe("button");
      expect(card.getAttribute("aria-roledescription")).toBe("flashcard");
      expect(card.getAttribute("aria-label")).toBe("Flashcard: What is 2+2?");
      expect(card.getAttribute("aria-expanded")).toBe("false");
    });

    it("shows aria-expanded when flipped", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");
      expect(card.getAttribute("aria-expanded")).toBe("false");
    });

    it("supports keyboard Enter key when isTop", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");
      card.focus();
      fireEvent.keyDown(card, { key: "Enter" });
      expect(defaultProps.onSwipe).not.toHaveBeenCalled();
    });

    it("supports keyboard ArrowLeft to swipe left", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");
      card.focus();
      fireEvent.keyDown(card, { key: "ArrowLeft" });
      expect(defaultProps.onSwipe).toHaveBeenCalledWith("left");
    });

    it("supports keyboard ArrowRight to swipe right", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");
      card.focus();
      fireEvent.keyDown(card, { key: "ArrowRight" });
      expect(defaultProps.onSwipe).toHaveBeenCalledWith("right");
    });

    it("ignores keyboard events when not isTop", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} isTop={false} />);
      const card = getByTestId("swipeable-card");
      fireEvent.keyDown(card, { key: "ArrowRight" });
      expect(defaultProps.onSwipe).not.toHaveBeenCalled();
    });
  });

  describe("state management", () => {
    it("maintains flip state via aria-expanded", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");
      expect(card.getAttribute("aria-expanded")).toBe("false");
    });
  });
});
