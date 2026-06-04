import { describe, expect, test } from "bun:test";
import { mockGetDocument } from "./_appwrite-mocks";

const { loadVisualFromAppwrite, saveVisualToAppwrite } = await import(
	"../visual-persistence"
);

const sampleVisual = {
	type: "konva-diagram" as const,
	label: "Test Diagram",
	diagramType: "wave",
	diagramData: { amplitude: 10, frequency: 5, type: "transverse" },
};

describe("saveVisualToAppwrite", () => {
	test("runs without error", async () => {
		await expect(
			saveVisualToAppwrite("q1", "mathematics", sampleVisual),
		).resolves.toBeUndefined();
	});

	test("handles null visual", async () => {
		await expect(
			saveVisualToAppwrite("q1", "math", null),
		).resolves.toBeUndefined();
	});
});

describe("loadVisualFromAppwrite", () => {
	test("returns null when no document found", async () => {
		mockGetDocument.mockReset();
		mockGetDocument.mockResolvedValue(null);

		const result = await loadVisualFromAppwrite("q1", "mathematics");
		expect(result).toBeNull();
	});

	test("returns null when document does not exist (error)", async () => {
		mockGetDocument.mockReset();
		mockGetDocument.mockRejectedValue(new Error("Document not found"));

		const result = await loadVisualFromAppwrite("q1", "math");
		expect(result).toBeNull();
	});

	test("returns visual when document found and not expired", async () => {
		mockGetDocument.mockReset();
		mockGetDocument.mockResolvedValue({
			visual: JSON.stringify(sampleVisual),
			expiresAt: new Date(Date.now() + 86400000).toISOString(),
		});

		const result = await loadVisualFromAppwrite("q1", "mathematics");
		expect(result).not.toBeNull();
		expect(result?.type).toBe("konva-diagram");
		expect(result?.diagramType).toBe("wave");
	});

	test("returns null when document is expired", async () => {
		mockGetDocument.mockReset();
		mockGetDocument.mockResolvedValue({
			visual: JSON.stringify(sampleVisual),
			expiresAt: new Date(Date.now() - 86400000).toISOString(),
		});

		const result = await loadVisualFromAppwrite("q1", "mathematics");
		expect(result).toBeNull();
	});

	test("calls getDocument with correct params", async () => {
		mockGetDocument.mockReset();
		mockGetDocument.mockResolvedValue({
			visual: JSON.stringify(sampleVisual),
			expiresAt: new Date(Date.now() + 86400000).toISOString(),
		});

		await loadVisualFromAppwrite("q-test", "life-sciences");

		expect(mockGetDocument).toHaveBeenCalledWith(
			"test-db-id",
			"visuals",
			"q-test-life-sciences",
		);
	});
});
