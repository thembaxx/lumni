import { afterEach, beforeEach, describe, expect, test, mock } from "bun:test";
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
		fillText: mock(() => {}),
		beginPath: mock(() => {}),
		moveTo: mock(() => {}),
		lineTo: mock(() => {}),
		quadraticCurveTo: mock(() => {}),
		closePath: mock(() => {}),
		fill: mock(() => {}),
		stroke: mock(() => {}),
		createLinearGradient: mock(() => ({
			addColorStop: mock(() => {}),
		})),
		createRadialGradient: mock(() => ({
			addColorStop: mock(() => {}),
		})),
		fillRect: mock(() => {}),
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
		HTMLCanvasElement.prototype.getContext = mock(
			() => createMockCtx(),
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.toBlob = mock(
			(cb: (b: Blob | null) => void) => cb(mockBlob),
		) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

		const result = await generateShareCard(baseParams);
		expect(result).toBe(mockBlob);
		expect(result.type).toBe("image/png");
	});

	test("throws when toBlob returns null", async () => {
		HTMLCanvasElement.prototype.getContext = mock(
			() => createMockCtx(),
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.toBlob = mock(
			(cb: (b: Blob | null) => void) => cb(null),
		) as unknown as typeof HTMLCanvasElement.prototype.toBlob;

		await expect(generateShareCard(baseParams)).rejects.toThrow(
			"Canvas toBlob failed",
		);
	});

	test("renders correct text for each card type", async () => {
		const fillTextMock = mock(() => {});
		const ctx = { ...createMockCtx(), fillText: fillTextMock };

		HTMLCanvasElement.prototype.getContext = mock(
			() => ctx,
		) as unknown as typeof HTMLCanvasElement.prototype.getContext;
		HTMLCanvasElement.prototype.toBlob = mock(
			(cb: (b: Blob | null) => void) => cb(new Blob()),
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
