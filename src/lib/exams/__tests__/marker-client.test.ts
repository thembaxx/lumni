import { afterAll, beforeEach, describe, expect, mock, test } from "bun:test";

const mockUploadFiles = mock(
	async (): Promise<{ data: { ufsUrl: string; key: string }; error: null }> => ({
		data: { ufsUrl: "https://example.com/img.png", key: "img-key" },
		error: null,
	}),
);

mock.module("uploadthing/server", () => ({
	UTApi: mock(() => ({
		uploadFiles: mockUploadFiles,
	})),
	UTFile: mock((bytes: Uint8Array[], name: string) => ({ bytes, name })),
}));

const { convertPdfWithMarker, uploadImagesAndRewriteMarkdown } = await import(
	"../marker-client"
);

const originalFetch = globalThis.fetch;

afterAll(() => {
	globalThis.fetch = originalFetch;
});

describe("convertPdfWithMarker", () => {
	beforeEach(() => {
		globalThis.fetch = mock(
			async (
				_url: string | URL,
				_opts?: RequestInit,
			): Promise<Response> =>
				new Response(
					JSON.stringify({
						markdown: "# Converted PDF",
						images: [{ filename: "img1.png", data: "base64data" }],
						metadata: { pages: 2 },
					}),
					{ status: 200 },
				),
		);
	});

	test("returns MarkerResult on successful conversion", async () => {
		const buffer = Buffer.from("fake pdf content");
		const result = await convertPdfWithMarker(buffer, "test.pdf");
		expect(result.markdown).toBe("# Converted PDF");
		expect(result.images).toHaveLength(1);
		expect(result.images[0].filename).toBe("img1.png");
		expect(result.metadata.pages).toBe(2);
	});

	test("sends POST request to /convert endpoint", async () => {
		const fetchMock = mock(
			async (url: string | URL, opts?: RequestInit): Promise<Response> => {
				expect(url.toString()).toMatch(/\/convert$/);
				expect(opts?.method).toBe("POST");
				expect(opts?.body).toBeInstanceOf(FormData);
				return new Response(JSON.stringify({ markdown: "", images: [], metadata: {} }), {
					status: 200,
				});
			},
		);
		globalThis.fetch = fetchMock;
		await convertPdfWithMarker(Buffer.from("test"), "test.pdf");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});

	test("throws on non-ok response", async () => {
		globalThis.fetch = mock(
			async (): Promise<Response> => new Response("Bad Request", { status: 400 }),
		);
		await expect(
			convertPdfWithMarker(Buffer.from("test"), "bad.pdf"),
		).rejects.toThrow("Marker conversion failed (400)");
	});
});

describe("uploadImagesAndRewriteMarkdown", () => {
	beforeEach(() => {
		mockUploadFiles.mockReset();
		mockUploadFiles.mockResolvedValue({
			data: { ufsUrl: "https://example.com/img.png", key: "img-key" },
			error: null,
		});
	});

	test("returns original markdown unchanged when no images", async () => {
		const result = await uploadImagesAndRewriteMarkdown("# Hello", []);
		expect(result.markdown).toBe("# Hello");
		expect(result.imageUrlMap).toEqual({});
	});

	test("uploads images and rewrites markdown references", async () => {
		const markdown = "![diagram](diagram.png)";
		const result = await uploadImagesAndRewriteMarkdown(markdown, [
			{ filename: "diagram.png", data: "base64,iVBORw0KGgo=" },
		]);
		expect(result.markdown).toBe("![diagram](https://example.com/img.png)");
		expect(result.imageUrlMap["diagram.png"]).toBe("https://example.com/img.png");
	});

	test("uploads multiple images", async () => {
		mockUploadFiles
			.mockResolvedValueOnce({
				data: { ufsUrl: "https://example.com/a.png", key: "a-key" },
				error: null,
			})
			.mockResolvedValueOnce({
				data: { ufsUrl: "https://example.com/b.png", key: "b-key" },
				error: null,
			});
		const markdown = "![a](a.png) ![b](b.png)";
		const result = await uploadImagesAndRewriteMarkdown(markdown, [
			{ filename: "a.png", data: "base64,aaaa" },
			{ filename: "b.png", data: "base64,bbbb" },
		]);
		expect(result.markdown).toBe("![a](https://example.com/a.png) ![b](https://example.com/b.png)");
	});

	test("handles images with special regex chars in filename", async () => {
		const markdown = "![img](img(1).png)";
		const result = await uploadImagesAndRewriteMarkdown(markdown, [
			{ filename: "img(1).png", data: "base64,data" },
		]);
		expect(result.markdown).toBe("![img](https://example.com/img.png)");
	});

	test("throws when upload fails", async () => {
		mockUploadFiles.mockResolvedValue({
			data: null,
			error: "Upload rejected",
		});
		await expect(
			uploadImagesAndRewriteMarkdown("![img](x.png)", [
				{ filename: "x.png", data: "base64,fail" },
			]),
		).rejects.toThrow("Failed to upload image x.png");
	});
});
