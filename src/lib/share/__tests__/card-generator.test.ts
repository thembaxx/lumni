import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ShareCardParams } from "@/lib/share/card-generator";
import { generateShareCard } from "@/lib/share/card-generator";

const baseParams: ShareCardParams = {
  score: 17,
  total: 20,
  percentage: 85,
  title: "Mathematics Quiz",
  subtitle: "6/7 APS · B",
  type: "quiz",
};

function createMockCtx() {
  return {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "alphabetic" as CanvasTextBaseline,
    strokeStyle: "",
    lineWidth: 0,
    fillText: vi.fn(() => {}),
    beginPath: vi.fn(() => {}),
    moveTo: vi.fn(() => {}),
    lineTo: vi.fn(() => {}),
    quadraticCurveTo: vi.fn(() => {}),
    closePath: vi.fn(() => {}),
    fill: vi.fn(() => {}),
    stroke: vi.fn(() => {}),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(() => {}),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(() => {}),
    })),
    fillRect: vi.fn(() => {}),
  } as unknown as CanvasRenderingContext2D;
}

let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;
let originalToBlob: typeof HTMLCanvasElement.prototype.toBlob;

beforeEach(() => {
  originalGetContext = HTMLCanvasElement.prototype.getContext;
  originalToBlob = HTMLCanvasElement.prototype.toBlob;
});

afterEach(() => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toBlob = originalToBlob;
});

describe("generateShareCard", () => {
  test("returns a Blob on successful canvas render", async () => {
    const mockBlob = new Blob(["fake-png"], { type: "image/png" });
    HTMLCanvasElement.prototype.getContext = vi.fn(() =>
      createMockCtx(),
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) =>
      cb(mockBlob),
    ) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    const result = await generateShareCard(baseParams);
    expect(result).toBe(mockBlob);
    expect(result.type).toBe("image/png");
  });

  test("throws when toBlob returns null", async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() =>
      createMockCtx(),
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) =>
      cb(null),
    ) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    await expect(generateShareCard(baseParams)).rejects.toThrow("Canvas toBlob failed");
  });

  test("renders correct text for each card type", async () => {
    const fillTextMock = vi.fn(() => {});
    const ctx = { ...createMockCtx(), fillText: fillTextMock };

    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ctx,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.toBlob = vi.fn((cb: (b: Blob | null) => void) =>
      cb(new Blob()),
    ) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

    const types: ShareCardParams["type"][] = ["quiz", "exam", "flashcard"];
    for (const type of types) {
      fillTextMock.mockReset();
      await generateShareCard({ ...baseParams, type, title: `${type} test` });

      const calls = fillTextMock.mock.calls.map((c) => c[0]);
      expect(calls).toContain("LUMNI");
      expect(calls).toContain("85%");
      expect(calls).toContain("17 / 20 Correct");
      expect(calls).toContain(`${type} test`);
    }
  });
});
