import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;
const originalEnv = process.env.TINYFISH_API_KEY;

const usageStore = new Map<
	string,
	{ id: number; userId: string; date: string; count: number }
>();
const cacheStore = new Map<
	string,
	{ key: string; value: unknown; expiresAt: number; fetchedAt: number }
>();
let usageAutoId = 1;
let consentGranted = false;

mock.module("@/lib/db/schema", () => ({
	offlineDB: {
		tinyfishCache: {
			get(key: string) {
				return Promise.resolve(cacheStore.get(key) ?? undefined);
			},
			put(value: {
				key: string;
				value: unknown;
				expiresAt: number;
				fetchedAt: number;
			}) {
				cacheStore.set(value.key, value);
				return Promise.resolve(value.key);
			},
			delete(key: string) {
				cacheStore.delete(key);
				return Promise.resolve(undefined);
			},
		},
		tinyfishUsage: {
			where() {
				return {
					equals(value: unknown) {
						const [userId, date] = value as [string, string];
						return {
							async first() {
								for (const entry of usageStore.values()) {
									if (entry.userId === userId && entry.date === date)
										return entry;
								}
								return undefined;
							},
						};
					},
				};
			},
			update(id: number, value: { count: number }) {
				for (const entry of usageStore.values()) {
					if (entry.id === id) entry.count = value.count;
				}
				return Promise.resolve(id);
			},
			add(value: { userId: string; date: string; count: number }) {
				const id = usageAutoId++;
				usageStore.set(`${value.userId}:${value.date}:${id}`, { id, ...value });
				return Promise.resolve(id);
			},
		},
	},
}));

mock.module("@/lib/consent/ai-gate", () => ({
	getDataSharingConsent: () => consentGranted,
	updateDataSharingConsent: (g: boolean) => {
		consentGranted = g;
	},
}));

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" },
	});
}

beforeEach(() => {
	usageStore.clear();
	cacheStore.clear();
	usageAutoId = 1;
	consentGranted = false;
	process.env.TINYFISH_API_KEY = "test-key";
});

afterEach(() => {
	globalThis.fetch = originalFetch;
	process.env.TINYFISH_API_KEY = originalEnv;
	cacheStore.clear();
	usageStore.clear();
	consentGranted = false;
});

describe("searchWithRAG", () => {
	test("returns empty context when subject is not in allowlist", async () => {
		consentGranted = true;
		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "life-orientation",
			topic: "Career planning",
		});
		expect(result.sources).toEqual([]);
	});

	test("returns empty when consent not granted", async () => {
		consentGranted = false;
		globalThis.fetch = mock(async () => jsonResponse({})) as typeof fetch;
		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "Algebra",
		});
		expect(result.sources).toEqual([]);
	});

	test("returns empty when API key not configured", async () => {
		consentGranted = true;
		process.env.TINYFISH_API_KEY = "";
		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "Algebra",
		});
		expect(result.sources).toEqual([]);
	});

	test("returns empty when topic is empty", async () => {
		consentGranted = true;
		globalThis.fetch = mock(async () => jsonResponse({})) as typeof fetch;
		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "",
		});
		expect(result.sources).toEqual([]);
	});

	test("fetches and wraps sources for allowed subject", async () => {
		consentGranted = true;
		let searchCalled = false;
		let fetchCalled = false;
		globalThis.fetch = mock(async (url: string | URL | Request) => {
			const s = String(url);
			if (s.includes("api.search.tinyfish.ai")) {
				searchCalled = true;
				return jsonResponse({
					query: "mathematics Algebra CAPS curriculum",
					results: [
						{
							position: 1,
							site_name: "edu.za",
							title: "CAPS Mathematics Algebra",
							snippet: "Algebra is...",
							url: "https://www.education.gov.za/algebra",
						},
					],
					total_results: 1,
				});
			}
			if (s.includes("api.fetch.tinyfish.ai")) {
				fetchCalled = true;
				return jsonResponse({
					results: [
						{
							url: "https://www.education.gov.za/algebra",
							title: "CAPS Mathematics Algebra",
							text: "Algebra is the study of mathematical symbols, variables, and rules. ".repeat(
								20,
							),
						},
					],
					errors: [],
				});
			}
			return jsonResponse({});
		}) as typeof fetch;

		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "Algebra",
		});

		expect(searchCalled).toBe(true);
		expect(fetchCalled).toBe(true);
		expect(result.sources).toHaveLength(1);
		expect(result.sources[0].url).toBe("https://www.education.gov.za/algebra");
		expect(result.xml).toContain("<reference_material");
	});

	test("blocks social media domains from results", async () => {
		consentGranted = true;
		globalThis.fetch = mock(async (url: string | URL | Request) => {
			const s = String(url);
			if (s.includes("api.search.tinyfish.ai")) {
				return jsonResponse({
					query: "x",
					results: [
						{
							position: 1,
							site_name: "pinterest",
							title: "Algebra on Pinterest",
							snippet: "x",
							url: "https://pinterest.com/pin/123",
						},
					],
					total_results: 1,
				});
			}
			return jsonResponse({ results: [], errors: [] });
		}) as typeof fetch;

		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "Algebra",
		});
		expect(result.sources).toEqual([]);
	});

	test("returns cached result on second call without extra network calls", async () => {
		consentGranted = true;
		let fetchCount = 0;
		globalThis.fetch = mock(async (url: string | URL | Request) => {
			fetchCount++;
			const s = String(url);
			if (s.includes("api.search.tinyfish.ai")) {
				return jsonResponse({
					query: "x",
					results: [
						{
							position: 1,
							site_name: "edu.za",
							title: "Title",
							snippet: "x",
							url: "https://www.education.gov.za/x",
						},
					],
					total_results: 1,
				});
			}
			return jsonResponse({
				results: [
					{
						url: "https://www.education.gov.za/x",
						title: "Title",
						text: "y".repeat(500),
					},
				],
				errors: [],
			});
		}) as typeof fetch;

		const { searchWithRAG } = await import("../index");
		const opts = { subject: "mathematics", topic: "Algebra" };
		const r1 = await searchWithRAG(opts);
		const r2 = await searchWithRAG(opts);
		expect(r1.sources).toHaveLength(1);
		expect(r2.sources).toHaveLength(1);
		expect(fetchCount).toBe(2);
	});

	test("enforces per-user daily limit", async () => {
		consentGranted = true;
		globalThis.fetch = mock(async () => jsonResponse({})) as typeof fetch;
		const { searchWithRAG } = await import("../index");
		const { getTodayUsageCount } = await import("../cache");

		for (let i = 0; i < 20; i++) {
			await searchWithRAG({
				subject: "mathematics",
				topic: `Topic ${i}`,
				userId: "user-limit",
			});
		}

		expect(await getTodayUsageCount("user-limit")).toBe(20);
	});

	test("returns empty and does not call network when user over daily limit", async () => {
		consentGranted = true;
		let networkCalled = false;
		globalThis.fetch = mock(async () => {
			networkCalled = true;
			return jsonResponse({});
		}) as typeof fetch;
		const { searchWithRAG } = await import("../index");
		const { incrementTodayUsage } = await import("../cache");

		for (let i = 0; i < 20; i++) {
			await incrementTodayUsage("over-limit");
		}

		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "Algebra",
			userId: "over-limit",
		});

		expect(result.sources).toEqual([]);
		expect(networkCalled).toBe(false);
	});

	test("fails open when network errors out", async () => {
		consentGranted = true;
		globalThis.fetch = mock(async () => {
			throw new Error("network down");
		}) as typeof fetch;
		const { searchWithRAG } = await import("../index");
		const result = await searchWithRAG({
			subject: "mathematics",
			topic: "Algebra",
		});
		expect(result.sources).toEqual([]);
		expect(result.xml).toBe("");
	});
});

describe("getSourceForQuestion", () => {
	test("rejects questions with < 5 words", async () => {
		consentGranted = true;
		globalThis.fetch = mock(async () => jsonResponse({})) as typeof fetch;
		const { getSourceForQuestion } = await import("../index");
		const result = await getSourceForQuestion({ question: "too short" });
		expect(result.sources).toEqual([]);
	});

	test("returns empty when consent not granted", async () => {
		consentGranted = false;
		globalThis.fetch = mock(async () => jsonResponse({})) as typeof fetch;
		const { getSourceForQuestion } = await import("../index");
		const result = await getSourceForQuestion({
			question: "When is the 2026 Maths Paper 2 exam?",
		});
		expect(result.sources).toEqual([]);
	});

	test("fetches a single source for valid question", async () => {
		consentGranted = true;
		globalThis.fetch = mock(async (url: string | URL | Request) => {
			const s = String(url);
			if (s.includes("api.search.tinyfish.ai")) {
				return jsonResponse({
					query: "x",
					results: [
						{
							position: 1,
							site_name: "edu.za",
							title: "DBE 2026 Timetable",
							snippet: "x",
							url: "https://www.education.gov.za/timetable",
						},
					],
					total_results: 1,
				});
			}
			return jsonResponse({
				results: [
					{
						url: "https://www.education.gov.za/timetable",
						title: "DBE 2026 Timetable",
						text: "Maths Paper 2 is on 12 November 2026 at 09:00. ".repeat(20),
					},
				],
				errors: [],
			});
		}) as typeof fetch;

		const { getSourceForQuestion } = await import("../index");
		const result = await getSourceForQuestion({
			question: "When is the 2026 Maths Paper 2 exam?",
		});
		expect(result.sources).toHaveLength(1);
		expect(result.sources[0].title).toBe("DBE 2026 Timetable");
		expect(result.xml).toContain("<reference_material");
	});
});
