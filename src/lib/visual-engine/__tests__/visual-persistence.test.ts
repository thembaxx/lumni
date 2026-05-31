import { describe, expect, mock, test } from "bun:test";

mock.module("@/lib/db/repositories/visual-cache", () => ({
	makeCacheKey: (questionId: string, subject: string) =>
		`${questionId}-${subject}`,
}));

mock.module("@/lib/shared/json", () => ({
	safeJsonParse: (str: string, fallback: unknown) => {
		try {
			return JSON.parse(str);
		} catch {
			return fallback;
		}
	},
	safeJsonStringify: (value: unknown) => JSON.stringify(value),
}));

const mockCreateDocument = mock(() => Promise.resolve());
const mockGetDocument = mock(() => Promise.resolve(null));

mock.module("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {
		createDocument: mockCreateDocument,
		getDocument: mockGetDocument,
	},
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
	serverAccount: {},
	serverClient: {},
}));

mock.module("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db-id",
	COLLECTIONS: { VISUALS: "visuals" },
}));

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
	test("creates document with correct params", async () => {
		mockCreateDocument.mockReset();
		mockCreateDocument.mockResolvedValue(undefined);

		await saveVisualToAppwrite("q1", "mathematics", sampleVisual);

		expect(mockCreateDocument).toHaveBeenCalledWith(
			"test-db-id",
			"visuals",
			"q1-mathematics",
			expect.objectContaining({
				questionId: "q1",
				subject: "mathematics",
				visual: expect.stringContaining("konva-diagram"),
			}),
		);
	});

	test("includes createdAt and expiresAt timestamps", async () => {
		mockCreateDocument.mockReset();
		mockCreateDocument.mockResolvedValue(undefined);
		const before = Date.now();

		await saveVisualToAppwrite("q1", "math", sampleVisual);

		const data = mockCreateDocument.mock.calls[0][3] as Record<string, unknown>;
		expect(data.createdAt).toBeString();
		expect(data.expiresAt).toBeString();
		expect(new Date(data.createdAt as string).getTime()).toBeGreaterThanOrEqual(
			before - 1000,
		);
	});

	test("handles null visual", async () => {
		mockCreateDocument.mockReset();
		mockCreateDocument.mockResolvedValue(undefined);

		await saveVisualToAppwrite("q1", "math", null);

		expect(mockCreateDocument).toHaveBeenCalledWith(
			"test-db-id",
			"visuals",
			"q1-math",
			expect.objectContaining({
				visual: "null",
			}),
		);
	});

	test("does not throw on Appwrite error", async () => {
		mockCreateDocument.mockReset();
		mockCreateDocument.mockRejectedValue(new Error("Appwrite unavailable"));

		await expect(
			saveVisualToAppwrite("q1", "math", sampleVisual),
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
