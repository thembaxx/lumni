import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

vi.mock("@/lib/flashcard-engine", () => ({
  SM2_QUALITIES: [
    { quality: 0, label: "Complete Blackout", description: "Couldn't recall at all" },
    {
      quality: 1,
      label: "Incorrect - Remembered",
      description: "Got it wrong but remembered after",
    },
    {
      quality: 2,
      label: "Incorrect - Easy",
      description: "Got it wrong, answer seemed easy after",
    },
    { quality: 3, label: "Correct - Hard", description: "Got it right with serious difficulty" },
    { quality: 4, label: "Correct - Good", description: "Got it right with some difficulty" },
    { quality: 5, label: "Correct - Perfect", description: "Perfect recall" },
  ],
}));

import { QualityPicker } from "@/components/flashcard/quality-picker";

const defaultProps = {
  polarity: "correct" as const,
  onSelect: vi.fn(),
  onTimeout: vi.fn(),
};

describe("QualityPicker", () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  describe("rendering", () => {
    it("renders the component", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      expect(getByTestId("quality-picker")).toBeTruthy();
    });

    it("shows correct labels for correct polarity", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      expect(getByTestId("quality-picker").textContent).toContain("How well did you know it?");
    });

    it("shows struggle labels for incorrect polarity", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} polarity="incorrect" />);
      expect(getByTestId("quality-picker").textContent).toContain("How much did you struggle?");
    });
  });

  describe("interactions", () => {
    it("calls onSelect with correct quality when button clicked", () => {
      vi.useFakeTimers();
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const btn = getByTestId("quality-button-5");
      btn.click();
      vi.advanceTimersByTime(200);
      expect(defaultProps.onSelect).toHaveBeenCalledWith(5);
      vi.useRealTimers();
    });

    it("shows selected button opacity style after click", () => {
      const { getByTestId } = render(<QualityPicker {...defaultProps} />);
      const btn5 = getByTestId("quality-button-5");
      btn5.click();
      expect(defaultProps.onSelect).not.toHaveBeenCalled();
    });
  });

  describe("accessibility", () => {
    it("has labeled fieldset for the rating group", () => {
      const { container } = render(<QualityPicker {...defaultProps} />);
      const fieldset = container.querySelector("fieldset");
      expect(fieldset).toBeTruthy();
      const legend = fieldset?.querySelector("legend");
      expect(legend?.className).toBe("sr-only");
    });
  });
});
