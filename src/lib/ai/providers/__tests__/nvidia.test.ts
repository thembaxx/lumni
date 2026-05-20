import { describe, expect, mock, test } from "bun:test";
import { createNvidiaProvider } from "../nvidia";

const MOCK_SUCCESS = {
	choices: [{ message: { content: "Hello from Nvidia" } }],
	usage: { prompt_tokens: 10, completion_tokens: 20 },
};

interface FetchOptions {
	method?: string;
	headers?: Record<string, string>;
	body?: string;
}

function mockFetch(response: object, status = 200) {
	const original = globalThis.fetch;
	globalThis.fetch = mock(() =>
		Promise.resolve(
			new Response(JSON.stringify(response), {
				status,
				headers: { "Content-Type": "application/json" },
			}),
		),
	);
	return original;
}

function restoreFetch(original: typeof globalThis.fetch) {
	globalThis.fetch = original;
}

function getFetchCallArgs(): [string, FetchOptions] {
	return (globalThis.fetch as ReturnType<typeof mock>).mock
		.calls[0] as unknown as [string, FetchOptions];
}

describe("createNvidiaProvider", () => {
	test("returns provider with correct name and model", () => {
		const provider = createNvidiaProvider("nvapi-test-key");
		expect(provider.name).toBe("nvidia");
		expect(provider.model).toBe("meta/llama-3.3-70b-instruct");
	});

	test("capabilities include systemPrompt but not images", () => {
		const provider = createNvidiaProvider("nvapi-test-key");
		expect(provider.capabilities?.systemPrompt).toBe(true);
		expect(provider.capabilities?.images).toBe(false);
	});

	test("generate returns content on success", async () => {
		const orig = mockFetch(MOCK_SUCCESS);
		const provider = createNvidiaProvider("nvapi-test-key");

		const result = await provider.generate({
			messages: [{ role: "user", content: "hi" }],
		});

		expect(result.content).toBe("Hello from Nvidia");
		expect(result.provider).toBe("nvidia");
		expect(result.inputTokens).toBe(10);
		expect(result.outputTokens).toBe(20);
		restoreFetch(orig);
	});

	test("generate sends correct request body", async () => {
		const orig = mockFetch(MOCK_SUCCESS);
		const provider = createNvidiaProvider("nvapi-test-key");

		await provider.generate({
			messages: [{ role: "user", content: "test" }],
			systemPrompt: "be helpful",
			temperature: 0.5,
			maxTokens: 100,
		});

		const [, opts] = getFetchCallArgs();
		const body = JSON.parse(opts.body ?? "{}");
		expect(body.model).toBe("meta/llama-3.3-70b-instruct");
		expect(body.messages).toEqual([
			{ role: "system", content: "be helpful" },
			{ role: "user", content: "test" },
		]);
		expect(body.temperature).toBe(0.5);
		expect(body.max_tokens).toBe(100);
		restoreFetch(orig);
	});

	test("generate maps model role to assistant", async () => {
		const orig = mockFetch(MOCK_SUCCESS);
		const provider = createNvidiaProvider("nvapi-test-key");

		await provider.generate({
			messages: [
				{ role: "model", content: "previous" },
				{ role: "user", content: "next" },
			],
		});

		const [, opts] = getFetchCallArgs();
		const body = JSON.parse(opts.body ?? "{}");
		expect((body.messages as Array<{ role: string }>)[0].role).toBe(
			"assistant",
		);
		restoreFetch(orig);
	});

	test("generate throws on non-ok response", async () => {
		const orig = mockFetch({ error: "not found" }, 400);
		const provider = createNvidiaProvider("nvapi-test-key");

		await expect(
			provider.generate({
				messages: [{ role: "user", content: "hi" }],
			}),
		).rejects.toThrow("Nvidia API error: 400");
		restoreFetch(orig);
	});

	test("generate uses defaults when options omitted", async () => {
		const orig = mockFetch(MOCK_SUCCESS);
		const provider = createNvidiaProvider("nvapi-test-key");

		await provider.generate({
			messages: [{ role: "user", content: "test" }],
		});

		const [, opts] = getFetchCallArgs();
		const body = JSON.parse(opts.body ?? "{}");
		expect(body.temperature).toBe(0.7);
		expect(body.max_tokens).toBe(2048);
		restoreFetch(orig);
	});

	test("generate returns empty string when content is missing", async () => {
		const orig = mockFetch({ choices: [{}], usage: {} });
		const provider = createNvidiaProvider("nvapi-test-key");

		const result = await provider.generate({
			messages: [{ role: "user", content: "hi" }],
		});

		expect(result.content).toBe("");
		restoreFetch(orig);
	});

	test("send Authorization header with Bearer token", async () => {
		const orig = mockFetch(MOCK_SUCCESS);
		const provider = createNvidiaProvider("nvapi-secret-123");

		await provider.generate({
			messages: [{ role: "user", content: "test" }],
		});

		const [, opts] = getFetchCallArgs();
		expect(opts.headers?.Authorization).toBe("Bearer nvapi-secret-123");
		restoreFetch(orig);
	});
});
