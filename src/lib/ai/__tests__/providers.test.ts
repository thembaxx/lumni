import { describe, expect, mock, test } from "bun:test";

const GEMINI_MOCK_RESPONSE = {
	candidates: [
		{
			content: {
				parts: [{ text: "Gemini response text" }],
			},
		},
	],
};

const GROQ_MOCK_RESPONSE = {
	choices: [{ message: { content: "Groq response text" } }],
	usage: { prompt_tokens: 8, completion_tokens: 15 },
};

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

import { createGeminiProvider } from "../providers/gemini";
import { createGroqProvider } from "../providers/groq";

describe("createGeminiProvider", () => {
	test("returns provider with correct name and model", () => {
		const provider = createGeminiProvider("test-key");
		expect(provider.name).toBe("gemini");
		expect(provider.model).toBe("gemini-2.0-flash-lite-001");
	});

	test("capabilities include systemPrompt and images", () => {
		const provider = createGeminiProvider("test-key");
		expect(provider.capabilities?.systemPrompt).toBe(true);
		expect(provider.capabilities?.images).toBe(true);
	});

	test("generate returns content on success", async () => {
		const orig = mockFetch(GEMINI_MOCK_RESPONSE);
		const provider = createGeminiProvider("test-key");

		const result = await provider.generate({
			messages: [{ role: "user", content: "hello" }],
		});

		expect(result.content).toBe("Gemini response text");
		expect(result.provider).toBe("gemini");
		expect(result.model).toBe("gemini-2.0-flash-lite-001");
		restoreFetch(orig);
	});

	test("generate includes system instruction when systemPrompt provided", async () => {
		const orig = mockFetch(GEMINI_MOCK_RESPONSE);
		const provider = createGeminiProvider("test-key");

		await provider.generate({
			messages: [{ role: "user", content: "hello" }],
			systemPrompt: "be concise",
		});

		const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
			.calls[0] as unknown as [string, { body?: string }];
		const body = JSON.parse(callArgs[1].body!);
		expect(body.system_instruction).toBeDefined();
		expect(body.system_instruction.parts[0].text).toBe("be concise");
		restoreFetch(orig);
	});

	test("generate throws on non-ok response", async () => {
		const orig = mockFetch({ error: "unauthorized" }, 401);
		const provider = createGeminiProvider("test-key");

		await expect(
			provider.generate({
				messages: [{ role: "user", content: "hi" }],
			}),
		).rejects.toThrow("Gemini API error: 401");
		restoreFetch(orig);
	});

	test("generate returns empty string when content is missing", async () => {
		const orig = mockFetch({ candidates: [] });
		const provider = createGeminiProvider("test-key");

		const result = await provider.generate({
			messages: [{ role: "user", content: "hi" }],
		});

		expect(result.content).toBe("");
		restoreFetch(orig);
	});

	test("maps model role correctly", async () => {
		const orig = mockFetch(GEMINI_MOCK_RESPONSE);
		const provider = createGeminiProvider("test-key");

		await provider.generate({
			messages: [
				{ role: "model", content: "previous" },
				{ role: "user", content: "next" },
			],
		});

		const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
			.calls[0] as unknown as [string, { body?: string }];
		const body = JSON.parse(callArgs[1].body!);
		const roles = body.contents.map((c: { role: string }) => c.role);
		expect(roles[0]).toBe("model");
		expect(roles[1]).toBe("user");
		restoreFetch(orig);
	});
});

describe("createGroqProvider", () => {
	test("returns provider with correct name and model", () => {
		const provider = createGroqProvider("groq-test-key");
		expect(provider.name).toBe("groq");
		expect(provider.model).toBe("llama-3.3-70b-versatile");
	});

	test("capabilities include systemPrompt but not images", () => {
		const provider = createGroqProvider("groq-test-key");
		expect(provider.capabilities?.systemPrompt).toBe(true);
		expect(provider.capabilities?.images).toBe(false);
	});

	test("generate returns content and token usage", async () => {
		const orig = mockFetch(GROQ_MOCK_RESPONSE);
		const provider = createGroqProvider("groq-test-key");

		const result = await provider.generate({
			messages: [{ role: "user", content: "hello" }],
		});

		expect(result.content).toBe("Groq response text");
		expect(result.provider).toBe("groq");
		expect(result.inputTokens).toBe(8);
		expect(result.outputTokens).toBe(15);
		restoreFetch(orig);
	});

	test("generate prepends system message when systemPrompt provided", async () => {
		const orig = mockFetch(GROQ_MOCK_RESPONSE);
		const provider = createGroqProvider("groq-test-key");

		await provider.generate({
			messages: [{ role: "user", content: "hello" }],
			systemPrompt: "be helpful",
		});

		const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
			.calls[0] as unknown as [string, { body?: string }];
		const body = JSON.parse(callArgs[1].body!);
		expect(body.messages[0].role).toBe("system");
		expect(body.messages[0].content).toBe("be helpful");
		expect(body.messages[1].role).toBe("user");
		restoreFetch(orig);
	});

	test("generate sends Authorization header", async () => {
		const orig = mockFetch(GROQ_MOCK_RESPONSE);
		const provider = createGroqProvider("groq-secret-123");

		await provider.generate({
			messages: [{ role: "user", content: "test" }],
		});

		const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
			.calls[0] as unknown as [string, { headers?: Record<string, string> }];
		expect(callArgs[1].headers!.Authorization).toBe("Bearer groq-secret-123");
		restoreFetch(orig);
	});

	test("generate uses defaults when options omitted", async () => {
		const orig = mockFetch(GROQ_MOCK_RESPONSE);
		const provider = createGroqProvider("groq-test-key");

		await provider.generate({
			messages: [{ role: "user", content: "test" }],
		});

		const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
			.calls[0] as unknown as [string, { body?: string }];
		const body = JSON.parse(callArgs[1].body!);
		expect(body.temperature).toBe(0.7);
		expect(body.max_tokens).toBe(2048);
		restoreFetch(orig);
	});

	test("generate maps model role to assistant", async () => {
		const orig = mockFetch(GROQ_MOCK_RESPONSE);
		const provider = createGroqProvider("groq-test-key");

		await provider.generate({
			messages: [
				{ role: "model", content: "prev" },
				{ role: "user", content: "next" },
			],
		});

		const callArgs = (globalThis.fetch as ReturnType<typeof mock>).mock
			.calls[0] as unknown as [string, { body?: string }];
		const body = JSON.parse(callArgs[1].body!);
		expect(body.messages[0].role).toBe("assistant");
		restoreFetch(orig);
	});

	test("generate throws on non-ok response", async () => {
		const orig = mockFetch({ error: "rate limited" }, 429);
		const provider = createGroqProvider("groq-test-key");

		await expect(
			provider.generate({
				messages: [{ role: "user", content: "hi" }],
			}),
		).rejects.toThrow("Groq API error: 429");
		restoreFetch(orig);
	});

	test("generate returns empty string when content missing", async () => {
		const orig = mockFetch({ choices: [{}], usage: {} });
		const provider = createGroqProvider("groq-test-key");

		const result = await provider.generate({
			messages: [{ role: "user", content: "hi" }],
		});

		expect(result.content).toBe("");
		restoreFetch(orig);
	});
});
