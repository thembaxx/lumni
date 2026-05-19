import { describe, expect, test } from "bun:test";
import type {
	AIFailure,
	AIProvider,
	AIProviderCapabilities,
	AIRequest,
	AIResponse,
	AIResult,
	ChatMessage,
	TaskRequest,
	TaskType,
} from "../types";

describe("AI types", () => {
	test("ChatMessage type structure", () => {
		const msg: ChatMessage = { role: "user", content: "hello" };
		expect(msg.role).toBe("user");
		expect(msg.content).toBe("hello");

		const sys: ChatMessage = { role: "system", content: "be helpful" };
		expect(sys.role).toBe("system");

		const withImage: ChatMessage = {
			role: "user",
			content: "describe this",
			imageUrl: "https://example.com/img.png",
		};
		expect(withImage.imageUrl).toBeDefined();
	});

	test("AIRequest accepts all optional fields", () => {
		const req: AIRequest = {
			messages: [{ role: "user", content: "hi" }],
			systemPrompt: "be concise",
			temperature: 0.3,
			maxTokens: 500,
		};
		expect(req.messages).toHaveLength(1);
		expect(req.systemPrompt).toBe("be concise");
		expect(req.temperature).toBe(0.3);
	});

	test("AIResponse has all required fields", () => {
		const res: AIResponse = {
			content: "answer",
			provider: "gemini",
			model: "gemini-2.0-flash-lite-001",
			inputTokens: 10,
			outputTokens: 20,
		};
		expect(res.content).toBe("answer");
		expect(res.provider).toBe("gemini");
		expect(res.inputTokens).toBe(10);
	});

	test("AIResponse without optional token fields", () => {
		const res: AIResponse = {
			content: "answer",
			provider: "gemini",
			model: "gemini-2.0-flash-lite-001",
		};
		expect(res.inputTokens).toBeUndefined();
	});

	test("AIFailure has error and available flag", () => {
		const fail: AIFailure = {
			error: "API key missing",
			provider: "gemini",
			available: false,
		};
		expect(fail.error).toBe("API key missing");
		expect(fail.available).toBe(false);
	});

	test("AIResult is a union of AIResponse and AIFailure", () => {
		const success: AIResult = {
			content: "ok",
			provider: "groq",
			model: "llama",
		};
		const failure: AIResult = {
			error: "fail",
			provider: "none",
			available: false,
		};
		expect("content" in success).toBe(true);
		expect("error" in failure).toBe(true);
	});

	test("AIProviderCapabilities defaults", () => {
		const caps: AIProviderCapabilities = {};
		expect(caps.systemPrompt).toBeUndefined();
		expect(caps.images).toBeUndefined();
	});

	test("AIProvider interface", () => {
		const provider: AIProvider = {
			name: "test",
			model: "test-model",
			generate: async () => ({
				content: "test",
				provider: "test",
				model: "test-model",
			}),
		};
		expect(provider.name).toBe("test");
		expect(provider.generate).toBeFunction();
	});

	test("TaskType union values", () => {
		const types: TaskType[] = [
			"lesson-summary",
			"question-generation",
			"concept-explanation",
			"content-creation",
			"quiz-generation",
		];
		expect(types).toHaveLength(5);
		expect(types).toContain("question-generation");
	});

	test("TaskRequest with different types", () => {
		const req: TaskRequest = {
			type: "question-generation",
			input: { subject: "math", count: 5 },
		};
		expect(req.type).toBe("question-generation");
		expect(req.input.subject).toBe("math");
	});

	test("TaskRequest with lesson-summary type", () => {
		const req: TaskRequest = {
			type: "lesson-summary",
			input: { lessonText: "algebra basics" },
		};
		expect(req.type).toBe("lesson-summary");
	});
});
