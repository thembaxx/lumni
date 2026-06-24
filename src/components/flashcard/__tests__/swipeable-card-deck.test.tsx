import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: vi.fn(() => ({
    user: { $id: "user-1", name: "Test User", labels: [] },
    status: "authenticated",
    isAnonymous: false,
  })),
}));

vi.mock("@/lib/services/flashcard-engine", () => ({
  useFlashcardEngine: vi.fn(() => ({
    isGenerating: false,
    generateFlashcard: vi.fn(),
    updateFlashcard: vi.fn(),
    deleteFlashcard: vi.fn(),
  })),
}));

vi.mock("@/lib/services/tinyfish", () => ({
  searchWithRAG: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/lib/services/notification-service", () => ({
  initializeNotificationSchedulers: vi.fn(),
}));

vi.mock("@/hooks/use-swipe-deck", () => ({
  useSwipeDeck: vi.fn(() => ({
    currentCardIndex: 0,
    currentCard: { id: "test-card-1", front: "Question 1", back: "Answer 1" },
    cards: [
      { id: "test-card-1", front: "Question 1", back: "Answer 1" },
      { id: "test-card-2", front: "Question 2", back: "Answer 2" },
      { id: "test-card-3", front: "Question 3", back: "Answer 3" },
    ],
    isFlipped: false,
    setCurrentCardIndex: vi.fn(),
    setIsFlipped: vi.fn(),
    handleSwipeLeft: vi.fn(),
    handleSwipeRight: vi.fn(),
    handleQualitySelect: vi.fn(),
  })),
}));

import { SwipeableCardDeck } from "@/components/flashcard/swipeable-card-deck";

const defaultProps = {
  cards: [
    { id: "test-card-1", front: "Question 1", back: "Answer 1" },
    { id: "test-card-2", front: "Question 2", back: "Answer 2" },
    { id: "test-card-3", front: "Question 3", back: "Answer 3" },
  ],
  mode: "simple" as const,
  onCardComplete: vi.fn(),
  onCompleteAll: vi.fn(),
};

describe("SwipeableCardDeck", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders the component with correct number of cards", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      expect(getByTestId("swipeable-card-deck")).toBeTruthy();

      const cards = getByTestId("card-stack");
      expect(cards.children.length).toBe(3);
    });

    it("renders correct card content", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const card1 = getByTestId("card-0");
      const card2 = getByTestId("card-1");
      const card3 = getByTestId("card-2");

      expect(card1).toHaveTextContent("Question 1");
      expect(card2).toHaveTextContent("Question 2");
      expect(card3).toHaveTextContent("Question 3");
    });

    it("shows correct card counter", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const counter = getByTestId("card-counter");

      expect(counter).toHaveTextContent("1 - 3");
    });

    it("renders mode indicator", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const modeIndicator = getByTestId("mode-indicator");

      expect(modeIndicator).toHaveTextContent("Simple Mode");
    });

    it("renders exit button", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const exitButton = getByTestId("exit-button");

      expect(exitButton).toBeTruthy();
    });
  });

  describe("navigation", () => {
    it("navigates to next card when swipe left", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const swipeLeftButton = getByTestId("swipe-left-button");
      swipeLeftButton.click();

      expect(defaultProps.onCardComplete).toHaveBeenCalledWith({
        card: defaultProps.cards[0],
        rating: 0,
      });
    });

    it("navigates to next card when swipe right", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const swipeRightButton = getByTestId("swipe-right-button");
      swipeRightButton.click();

      expect(defaultProps.onCardComplete).toHaveBeenCalledWith({
        card: defaultProps.cards[0],
        rating: 1,
      });
    });

    it("handles card quality selection", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const qualityButton = getByTestId("quality-button-3");
      qualityButton.click();

      expect(defaultProps.onCardComplete).toHaveBeenCalledWith({
        card: defaultProps.cards[0],
        rating: 2,
      });
    });

    it("skips cards when skipped", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const skipButton = getByTestId("skip-button");
      skipButton.click();

      expect(defaultProps.onCardComplete).toHaveBeenCalledWith({
        card: defaultProps.cards[0],
        rating: 0,
      });
    });
  });

  describe("progress tracking", () => {
    it("tracks completed cards", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const completeButton = getByTestId("complete-button");
      completeButton.click();

      const progressBar = getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("data-progress", "33");
    });

    it("shows completion percentage", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const progressBar = getByTestId("progress-bar");
      expect(progressBar).toHaveAttribute("aria-valuenow", "33");
      expect(progressBar).toHaveAttribute("aria-valuemax", "100");
    });
  });

  describe("mode switching", () => {
    it("renders SM-2 mode when mode is sm2", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} mode="sm2" />);

      const modeIndicator = getByTestId("mode-indicator");
      expect(modeIndicator).toHaveTextContent("SM-2 Mode");
    });

    it("shows quality picker for SM-2 mode", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} mode="sm2" />);

      const qualityPicker = getByTestId("quality-picker");
      expect(qualityPicker).toBeTruthy();
    });
  });

  describe("empty deck handling", () => {
    it("shows message when no cards provided", () => {
      const { getByTestId } = render(<SwipeableCardDeck cards={[]} {...defaultProps} />);

      const emptyMessage = getByTestId("empty-deck-message");
      expect(emptyMessage).toBeTruthy();
      expect(emptyMessage).toHaveTextContent("No cards to review");
    });

    it("does not show navigation when no cards", () => {
      const { queryByTestId } = render(<SwipeableCardDeck cards={[]} {...defaultProps} />);

      expect(queryByTestId("swipe-left-button")).toBeNull();
      expect(queryByTestId("swipe-right-button")).toBeNull();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA labels for navigation buttons", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);

      const swipeLeftButton = getByTestId("swipe-left-button");
      const swipeRightButton = getByTestId("swipe-right-button");
      const skipButton = getByTestId("skip-button");
      const completeButton = getByTestId("complete-button");

      expect(swipeLeftButton).toHaveAttribute("aria-label", "Skip card");
      expect(swipeRightButton).toHaveAttribute("aria-label", "Review card");
      expect(skipButton).toHaveAttribute("aria-label", "Skip card");
      expect(completeButton).toHaveAttribute("aria-label", "Complete card");
    });

    it("has proper ARIA roles for progress indicator", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const progressBar = getByTestId("progress-bar");

      expect(progressBar).toHaveAttribute("role", "progressbar");
    });

    it("supports keyboard navigation", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const swipeRightButton = getByTestId("swipe-right-button");

      swipeRightButton.focus();
      swipeRightButton.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      expect(defaultProps.onCardComplete).toHaveBeenCalled();
    });
  });

  describe("visual effects", () => {
    it("applies transition styles to cards", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const cardStack = getByTestId("card-stack");

      expect(cardStack).toHaveClass("card-stack");
    });

    it("shows correct animation states", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const cardStack = getByTestId("card-stack");

      expect(cardStack).toHaveClass("animate-card-stack");
    });
  });

  describe("state management", () => {
    it("handles rapid button clicks", () => {
      const { getByTestId } = render(<SwipeableCardDeck {...defaultProps} />);
      const completeButton = getByTestId("complete-button");

      completeButton.click();
      completeButton.click();

      expect(defaultProps.onCardComplete).toHaveBeenCalledTimes(2);
    });

    it("maintains mode state correctly", () => {
      const { rerender, getByTestId } = render(
        <SwipeableCardDeck {...defaultProps} mode="simple" />,
      );

      const modeIndicator = getByTestId("mode-indicator");
      expect(modeIndicator).toHaveTextContent("Simple Mode");

      rerender(<SwipeableCardDeck {...defaultProps} mode="sm2" />);

      expect(modeIndicator).toHaveTextContent("SM-2 Mode");
    });
  });

  describe("edge cases", () => {
    it("handles single card deck", () => {
      const singleCardDeck = [{ id: "single-card", front: "Question", back: "Answer" }];
      const { getByTestId } = render(
        <SwipeableCardDeck cards={singleCardDeck} {...defaultProps} />,
      );

      const counter = getByTestId("card-counter");
      expect(counter).toHaveTextContent("1 - 1");
    });

    it("handles long card content", () => {
      const longCardDeck = [
        {
          id: "long-card",
          front: "This is a very long question that might cause layout issues",
          back: "This is the answer to the very long question that might cause layout issues",
        },
      ];
      const { getByTestId } = render(<SwipeableCardDeck cards={longCardDeck} {...defaultProps} />);

      const card = getByTestId("card-0");
      expect(card).toBeTruthy();
    });
  });
});
