import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;
const originalEnv = process.env.TINYFISH_API_KEY;

function mockJsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

describe("tinyfishSearch", () => {
	beforeEach(() => {
		process.env.TINYFISH_API_KEY = "test-key";
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		process.env.TINYFISH_API_KEY = originalEnv;
	});

	test("returns empty for empty query", async () => {
		const { tinyfishSearch } = await import("../client");
		const result = await tinyfishSearch("");
		expect(result.results).toEqual([]);
	});

	test("returns empty for single-char query", async () => {
		const { tinyfishSearch } = await import("../client");
		const result = await tinyfishSearch("a");
		expect(result.results).toEqual([]);
	});

	test("calls Search API with correct query params", async () => {
		let calledUrl = "";
		globalThis.fetch = mock(async (url: string | URL | Request) => {
			calledUrl = String(url);
			return mockJsonResponse({
				query: "photosynthesis",
				results: [
					{
						position: 1,
						site_name: "edu.za",
						title: "Photosynthesis - DBE",
						snippet: "Process by which plants...",
						url: "https://www.education.gov.za/photosynthesis",
					},
				],
				total_results: 1,
			});
		}) as typeof fetch;

		const { tinyfishSearch } = await import("../client");
		const result = await tinyfishSearch("photosynthesis", {
			location: "ZA",
			language: "en",
			numResults: 3,
		});

		expect(calledUrl).toContain("https://api.search.tinyfish.ai");
		expect(calledUrl).toContain("query=photosynthesis");
		expect(calledUrl).toContain("location=ZA");
		expect(calledUrl).toContain("language=en");
		expect(calledUrl).toContain("num_results=3");
		expect(result.results).toHaveLength(1);
		expect(result.results[0].title).toBe("Photosynthesis - DBE");
	});

	test("sends X-API-Key header", async () => {
		let calledHeaders: HeadersInit | undefined;
		globalThis.fetch = mock(
			async (_url: string | URL | Request, init?: RequestInit) => {
				calledHeaders = init?.headers;
				return mockJsonResponse({ query: "x", results: [], total_results: 0 });
			},
		) as typeof fetch;

		const { tinyfishSearch } = await import("../client");
		await tinyfishSearch("test query");

		const headers = calledHeaders as Record<string, string> | undefined;
		expect(headers?.["X-API-Key"]).toBe("test-key");
	});

	test("throws TinyFishError on 4xx", async () => {
		globalThis.fetch = mock(
			async () => new Response("forbidden", { status: 403 }),
		) as typeof fetch;

		const { tinyfishSearch, TinyFishError } = await import("../client");
		await expect(tinyfishSearch("valid query here")).rejects.toThrow(
			TinyFishError,
		);
	});

	test("throws when API key not configured", async () => {
		process.env.TINYFISH_API_KEY = "";
		const { tinyfishSearch, TinyFishError } = await import("../client");
		await expect(tinyfishSearch("test")).rejects.toThrow(TinyFishError);
	});
});

describe("tinyfishFetch", () => {
	beforeEach(() => {
		process.env.TINYFISH_API_KEY = "test-key";
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
		process.env.TINYFISH_API_KEY = originalEnv;
	});

	test("returns empty when urls is empty", async () => {
		const { tinyfishFetch } = await import("../client");
		const result = await tinyfishFetch([]);
		expect(result.results).toEqual([]);
		expect(result.errors).toEqual([]);
	});

	test("POSTs to Fetch API with urls body", async () => {
		let calledUrl = "";
		let calledBody: unknown;
		globalThis.fetch = mock(
			async (url: string | URL | Request, init?: RequestInit) => {
				calledUrl = String(url);
				calledBody = init?.body;
				return mockJsonResponse({
					results: [
						{
							url: "https://x.com",
							title: "X",
							text: "y".repeat(2000),
						},
					],
					errors: [],
				});
			},
		) as typeof fetch;

		const { tinyfishFetch } = await import("../client");
		const result = await tinyfishFetch(["https://x.com"], {
			format: "markdown",
		});

		expect(calledUrl).toBe("https://api.fetch.tinyfish.ai");
		const body = JSON.parse(calledBody as string) as {
			urls: string[];
			format: string;
		};
		expect(body.urls).toEqual(["https://x.com"]);
		expect(body.format).toBe("markdown");
		expect(result.results[0].title).toBe("X");
	});

	test("throws on 5xx", async () => {
		globalThis.fetch = mock(
			async () => new Response("server error", { status: 500 }),
		) as typeof fetch;

		const { tinyfishFetch, TinyFishError } = await import("../client");
		await expect(tinyfishFetch(["https://x.com"])).rejects.toThrow(
			TinyFishError,
		);
	});
});

describe("isTinyFishConfigured", () => {
	afterEach(() => {
		process.env.TINYFISH_API_KEY = originalEnv;
	});

	test("returns true when key is set", async () => {
		process.env.TINYFISH_API_KEY = "abc";
		const { isTinyFishConfigured } = await import("../client");
		expect(isTinyFishConfigured()).toBe(true);
	});

	test("returns false when key is empty", async () => {
		process.env.TINYFISH_API_KEY = "";
		const { isTinyFishConfigured } = await import("../client");
		expect(isTinyFishConfigured()).toBe(false);
	});

	test("returns false when key is undefined", async () => {
		delete process.env.TINYFISH_API_KEY;
		const { isTinyFishConfigured } = await import("../client");
		expect(isTinyFishConfigured()).toBe(false);
	});
});
