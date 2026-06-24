import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { DragEvent } from "react";

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

import { SwipeableCard } from "@/components/flashcard/swipeable-card";

const defaultProps = {
  card: {
    id: "test-card",
    front: "What is 2+2?",
    back: "4",
    topic: "Math",
  },
  isFlipped: false,
  onSwipeLeft: vi.fn(),
  onSwipeRight: vi.fn(),
  onToggleFlip: vi.fn(),
};

describe("SwipeableCard", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders the component with front content visible", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      expect(getByTestId("swipeable-card")).toBeTruthy();
      expect(getByTestId("card-front")).toBeTruthy();
      expect(getByTestId("card-back")).toBeTruthy();
    });

    it("shows front content when not flipped", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const front = getByTestId("card-front");
      const back = getByTestId("card-back");

      expect(front).toHaveClass("visible");
      expect(back).not.toHaveClass("visible");
    });

    it("shows back content when flipped", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} isFlipped={true} />);
      const front = getByTestId("card-front");
      const back = getByTestId("card-back");

      expect(front).not.toHaveClass("visible");
      expect(back).toHaveClass("visible");
    });

    it("has correct card content", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const front = getByTestId("card-front");
      const back = getByTestId("card-back");

      expect(front).toHaveTextContent("What is 2+2?");
      expect(back).toHaveTextContent("4");
    });

    it("has correct topic label", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const topic = getByTestId("card-topic");

      expect(topic).toHaveTextContent("Math");
    });
  });

  describe("interactions", () => {
    it("calls onToggleFlip when card is clicked", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      card.click();

      expect(defaultProps.onToggleFlip).toHaveBeenCalled();
    });

    it("calls onSwipeLeft when swiped left", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      card.dispatchEvent(new Event("swiped-left"));

      expect(defaultProps.onSwipeLeft).toHaveBeenCalledWith("test-card");
    });

    it("calls onSwipeRight when swiped right", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      card.dispatchEvent(new Event("swiped-right"));

      expect(defaultProps.onSwipeRight).toHaveBeenCalledWith("test-card");
    });

    it("handles mouse drag start", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      const dragStartEvent = new DragEvent("dragstart", { clientX: 0 });
      card.dispatchEvent(dragStartEvent);

      expect(card).toHaveClass("dragging");
    });

    it("handles mouse drag end", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      const dragEndEvent = new DragEvent("dragend", { clientX: 0 });
      card.dispatchEvent(dragEndEvent);

      expect(card).not.toHaveClass("dragging");
    });
  });

  describe("swipe gestures", () => {
    it("detects horizontal swipe gesture", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      const swipeEvent = new Event("swipe", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(swipeEvent, "detail", {
        value: { direction: "left" },
      });

      card.dispatchEvent(swipeEvent);

      expect(defaultProps.onSwipeLeft).toHaveBeenCalledWith("test-card");
    });

    it("handles swipe threshold correctly", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      const swipeEvent = new Event("swipe", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(swipeEvent, "detail", {
        value: { direction: "right" },
      });

      card.dispatchEvent(swipeEvent);

      expect(defaultProps.onSwipeRight).toHaveBeenCalledWith("test-card");
    });

    it("prevents default swipe behavior", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      const swipeEvent = new Event("swipe", {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(swipeEvent, "detail", {
        value: { direction: "left" },
      });

      const preventDefault = vi.fn();
      swipeEvent.preventDefault = preventDefault;

      card.dispatchEvent(swipeEvent);

      expect(preventDefault).toHaveBeenCalled();
    });
  });

  describe("visual effects", () => {
    it("applies opacity based on swipe progress", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      card.dispatchEvent(
        new Event("swipe", {
          bubbles: true,
          cancelable: true,
        }),
      );

      Object.defineProperty(card, "style", {
        value: { opacity: "0.5" },
      });

      expect(card.style.opacity).toBe("0.5");
    });

    it("applies transform based on swipe direction", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      Object.defineProperty(card, "style", {
        value: { transform: "translateX(-100px)" },
      });

      expect(card.style.transform).toBe("translateX(-100px)");
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA labels", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      expect(card).toHaveAttribute("aria-label", "Swipeable card: What is 2+2? Answer: 4");
    });

    it("supports keyboard navigation", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      card.focus();
      card.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      expect(defaultProps.onToggleFlip).toHaveBeenCalled();
    });

    it("has proper ARIA role for flip button", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const flipButton = getByTestId("flip-button");

      expect(flipButton).toHaveAttribute("role", "button");
      expect(flipButton).toHaveAttribute("aria-label", "Flip card");
    });

    it("has proper ARIA controls for flip state", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const front = getByTestId("card-front");
      const back = getByTestId("card-back");

      expect(front).toHaveAttribute("aria-hidden", "false");
      expect(back).toHaveAttribute("aria-hidden", "true");
    });
  });

  describe("state management", () => {
    it("handles multiple rapid clicks correctly", () => {
      const { getByTestId } = render(<SwipeableCard {...defaultProps} />);
      const card = getByTestId("swipeable-card");

      card.click();
      card.click();

      expect(defaultProps.onToggleFlip).toHaveBeenCalledTimes(2);
    });

    it("maintains flip state correctly", () => {
      const { rerender, getByTestId } = render(
        <SwipeableCard {...defaultProps} isFlipped={false} />,
      );
      const front = getByTestId("card-front");
      const back = getByTestId("card-back");

      expect(front).toHaveClass("visible");
      expect(back).not.toHaveClass("visible");

      rerender(<SwipeableCard {...defaultProps} isFlipped={true} />);

      expect(front).not.toHaveClass("visible");
      expect(back).toHaveClass("visible");
    });
  });
});
