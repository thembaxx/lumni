import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/components/markdown-renderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

import { ScanResult } from "@/components/tools/math/scan-result";
import type { SolverResult } from "@/lib/services/solve-pipeline";

function hasText(container: HTMLElement, regex: RegExp): boolean {
  return regex.test(container.textContent ?? "");
}

const mockResult: SolverResult = {
  solution: "x = -2 or x = -3",
  steps: ["Factor the quadratic", "Set each factor to zero", "Solve for x"],
  provider: "gemini",
};

describe("ScanResult", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders solution heading", () => {
    const { container } = render(<ScanResult result={mockResult} onRetry={() => {}} />);
    expect(hasText(container, /Solution/)).toBe(true);
  });

  test("renders solution content", () => {
    const { container } = render(<ScanResult result={mockResult} onRetry={() => {}} />);
    expect(hasText(container, /x = -2 or x = -3/)).toBe(true);
  });

  test("renders step-by-step section when steps exist", () => {
    const { container } = render(<ScanResult result={mockResult} onRetry={() => {}} />);
    expect(hasText(container, /Step-by-step/)).toBe(true);
    expect(hasText(container, /Factor the quadratic/)).toBe(true);
    expect(hasText(container, /Set each factor to zero/)).toBe(true);
    expect(hasText(container, /Solve for x/)).toBe(true);
  });

  test("renders retry button", () => {
    const { container } = render(<ScanResult result={mockResult} onRetry={() => {}} />);
    const buttons = container.getElementsByTagName("button");
    const retryButton = Array.from(buttons).find((b) =>
      hasText(b as unknown as HTMLElement, /Scan another problem/),
    );
    expect(retryButton).toBeTruthy();
  });

  test("hides step-by-step when no steps", () => {
    const { container } = render(
      <ScanResult result={{ ...mockResult, steps: [] }} onRetry={() => {}} />,
    );
    expect(hasText(container, /Step-by-step/)).toBe(false);
  });

  test("calls onRetry when retry button clicked", () => {
    let called = false;
    const { container } = render(
      <ScanResult
        result={mockResult}
        onRetry={() => {
          called = true;
        }}
      />,
    );
    const buttons = container.getElementsByTagName("button");
    const retryButton = Array.from(buttons).find((b) =>
      hasText(b as unknown as HTMLElement, /Scan another problem/),
    );
    (retryButton as HTMLButtonElement)?.click();
    expect(called).toBe(true);
  });
});
