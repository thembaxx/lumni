import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/components/markdown-renderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

vi.mock("@/hooks/use-swipe-deck", () => ({
  useSwipeDeck: vi.fn(() => ({
    currentIndex: 0,
    swipeDirection: null,
    showQualityPicker: false,
    canUndo: false,
    pending: false,
    isComplete: false,
    onSwipeEnd: vi.fn(),
    onQualitySelect: vi.fn(),
    undo: vi.fn(),
    resetPending: vi.fn(),
  })),
}));

vi.mock("@/components/flashcard/quality-picker", () => ({
  QualityPicker: () => <div data-testid="quality-picker" />,
}));

import { SwipeableCardDeck } from "@/components/flashcard/swipeable-card-deck";

const defaultCards = [
  { id: "test-card-1", front: "Question 1", back: "Answer 1" },
  { id: "test-card-2", front: "Question 2", back: "Answer 2" },
  { id: "test-card-3", front: "Question 3", back: "Answer 3" },
];

const defaultProps = {
  cards: defaultCards,
  mode: "simple" as const,
  onReview: vi.fn(),
  onComplete: vi.fn(),
};

describe("SwipeableCardDeck", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders the deck container", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      expect(getByTestId("swipeable-card-deck")).toBeTruthy();
    });

    it("shows card counter", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const counter = getByTestId("card-counter");
      expect(counter.textContent).toBe("1 / 3");
    });

    it("shows exit button", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      expect(getByTestId("exit-button")).toBeTruthy();
    });

    it("shows remaining count", () => {
      const { container } = render(<SwipeableCardDeck {...defaultProps} />);
      expect(container.textContent).toContain("remaining");
    });

    it("calls onComplete when exit button is clicked", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      getByTestId("exit-button").click();
      expect(defaultProps.onComplete).toHaveBeenCalled();
    });
  });

  describe("empty deck handling", () => {
    it("shows empty message when no cards provided", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} cards={[]} />);
      expect(getByTestId("empty-deck-message")).toBeTruthy();
    });

    it("shows no flashcards text when empty", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} cards={[]} />);
      expect(getByTestId("empty-deck-message").textContent).toContain("No flashcards available.");
    });
  });

  describe("accessibility", () => {
    it("has role application and label", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const deck = getByTestId("swipeable-card-deck");
      expect(deck.getAttribute("role")).toBe("application");
      expect(deck.getAttribute("aria-label")).toBe("Flashcard deck");
    });
  });

  describe("edge cases", () => {
    it("handles single card deck", () => {
      const singleCard = [{ id: "single-card", front: "Q", back: "A" }];
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} cards={singleCard} />);
      const counter = getByTestId("card-counter");
      expect(counter.textContent).toBe("1 / 1");
    });

    it("handles known and review counts", () => {
      const { container } = render(
        <SwipeableCardDeck {...defaultProps} knownCount={2} reviewCount={1} />,
      );
      expect(container.textContent).toContain("known");
      expect(container.textContent).toContain("review");
    });
  });
});
