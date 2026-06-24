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

vi.mock("@/lib/ai/client", () => ({
  generateText: vi.fn(() => Promise.resolve("Generated response")),
  streamText: vi.fn(() => Promise.resolve([])),
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

import { QualityPicker } from "@/components/flashcard/quality-picker";

const defaultProps = {
  isOpen: true,
  card: {
    id: "test-card",
    front: "What is 2+2?",
    back: "4",
    topic: "Math",
  },
  onComplete: vi.fn(),
  onSkip: vi.fn(),
};

describe("QualityPicker", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders the component when open", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      expect(getByTestId("quality-picker")).toBeTruthy();
    });

    it("does not render when closed", () => {
      const { queryByTestId } = render(<QualityPicker {...defaultProps} isOpen={false} />);
      expect(queryByTestId("quality-picker")).toBeNull();
    });

    it("renders correct number of buttons", () => {
      const { getAllByTestId } = render(<QualityPicker {...defaultProps} />);
      const buttons = getAllByTestId("quality-button");
      expect(buttons.length).toBe(6);
    });

    it("renders correct button labels", () => {
      const { getAllByTestId } = render(<QualityPicker {...defaultProps} />);
      const buttons = getAllByTestId("quality-button");
      expect(buttons[0]).toHaveTextContent("Good");
      expect(buttons[1]).toHaveTextContent("Hard");
      expect(buttons[2]).toHaveTextContent("Crap");
    });

    it("renders rating selector with correct count", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const ratingSelector = getByTestId("rating-selector");
      expect(ratingSelector).toHaveTextContent("6");
    });
  });

  describe("interactions", () => {
    it("calls onComplete with correct rating when button clicked", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const button = getByTestId("quality-button-1");
      button.click();

      expect(defaultProps.onComplete).toHaveBeenCalledWith(1);
    });

    it("calls onSkip when cancel button clicked", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const cancelButton = getByTestId("cancel-button");
      cancelButton.click();

      expect(defaultProps.onSkip).toHaveBeenCalled();
    });

    it("updates rating counter when button clicked", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const ratingSelector = getByTestId("rating-selector");

      const button = getByTestId("quality-button-2");
      button.click();

      expect(ratingSelector).toHaveTextContent("1");
    });

    it("auto-advances rating after timeout", async () => {
      vi.useFakeTimers();

      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const button = getByTestId("quality-button-1");
      button.click();

      vi.advanceTimersByTime(1500);

      expect(defaultProps.onComplete).toHaveBeenCalledWith(1);
      vi.useRealTimers();
    });
  });

  describe("accessibility", () => {
    it("has proper ARIA labels for buttons", () => {
      const { getAllByTestId } = render(<QualityPicker {...defaultProps} />);
      const buttons = getAllByTestId("quality-button");

      expect(buttons[0]).toHaveAttribute("aria-label", "Rate as good (1)");
      expect(buttons[1]).toHaveAttribute("aria-label", "Rate as hard (2)");
      expect(buttons[2]).toHaveAttribute("aria-label", "Rate as crap (3)");
    });

    it("has proper ARIA roles", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const ratingSelector = getByTestId("rating-selector");

      expect(ratingSelector).toHaveAttribute("role", "radiogroup");
    });

    it("supports keyboard navigation", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const button = getByTestId("quality-button-1");

      button.focus();
      button.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));

      expect(defaultProps.onComplete).toHaveBeenCalledWith(1);
    });
  });

  describe("state management", () => {
    it("starts with zero rating count", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const ratingSelector = getByTestId("rating-selector");

      expect(ratingSelector).toHaveTextContent("0");
    });

    it("handles multiple button clicks correctly", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);

      const button1 = getByTestId("quality-button-1");
      button1.click();

      const button2 = getByTestId("quality-button-2");
      button2.click();

      expect(defaultProps.onComplete).toHaveBeenCalledTimes(2);
    });
  });
});
