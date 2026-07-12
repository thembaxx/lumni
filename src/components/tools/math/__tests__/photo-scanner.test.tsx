import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

vi.mock("@/components/markdown-renderer", () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <span>{content}</span>,
}));

import { MathPhotoScanner } from "@/components/tools/math/photo-scanner";

function hasText(container: HTMLElement, regex: RegExp): boolean {
  return regex.test(container.textContent ?? "");
}

describe("MathPhotoScanner", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders heading", () => {
    const { container } = render(<MathPhotoScanner />);
    expect(hasText(container, /Photo Math Scanner/)).toBe(true);
  });

  test("renders subtitle", () => {
    const { container } = render(<MathPhotoScanner />);
    expect(hasText(container, /Type a math problem/)).toBe(true);
  });

  test("renders textarea input", () => {
    const { container } = render(<MathPhotoScanner />);
    const textarea = container.getElementsByTagName("textarea")[0];
    expect(textarea).toBeTruthy();
  });

  test("renders upload photo button", () => {
    const { container } = render(<MathPhotoScanner />);
    const buttons = container.getElementsByTagName("button");
    const uploadButton = Array.from(buttons).find((b) =>
      hasText(b as unknown as HTMLElement, /Upload photo/),
    );
    expect(uploadButton).toBeTruthy();
  });

  test("renders Solve button", () => {
    const { container } = render(<MathPhotoScanner />);
    const buttons = container.getElementsByTagName("button");
    const solveButton = Array.from(buttons).find((b) =>
      hasText(b as unknown as HTMLElement, /^Solve$/),
    );
    expect(solveButton).toBeTruthy();
  });

  test("Solve button is disabled when no input", () => {
    const { container } = render(<MathPhotoScanner />);
    const buttons = container.getElementsByTagName("button");
    const solveButton = Array.from(buttons).find((b) =>
      hasText(b as unknown as HTMLElement, /^Solve$/),
    );
    expect((solveButton as HTMLButtonElement)?.disabled).toBe(true);
  });
});
