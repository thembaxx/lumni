import { NextRequest, NextResponse } from "next/server";
import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import { cleanResponse } from "@/lib/ai/parse-response";
import type { AIResponse } from "@/lib/ai/types";
import { withRateLimit } from "@/lib/utils/with-rate-limit";

export const dynamic = "force-dynamic";

export const POST = withRateLimit(async (req: NextRequest) => {
	try {
		const { question, imageUrl } = await req.json();

		if (!question && !imageUrl) {
			return NextResponse.json(
				{ error: "Either question text or image is required" },
				{ status: 400 },
			);
		}

		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
				deepseekApiKey: process.env.DEEPSEEK_API_KEY,
			});
		}

		if (!isAIConfigured()) {
			return NextResponse.json(
				{
					error: "AI not configured",
					message: "Please configure at least one AI provider API key",
				},
				{ status: 503 },
			);
		}

		const systemPrompt =
			"You are an expert tutor for South African Matric students. Solve the provided problem and provide a clear, step-by-step explanation. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).";
		const userPrompt = question || "Solve the problem in the attached image.";

		const result = await generateWithSystem(systemPrompt, userPrompt, {
			temperature: 0.7,
			maxTokens: 4000,
			imageUrl,
		});

		if ("available" in result && !result.available) {
			const errorMsg = "error" in result ? result.error : "Unknown error";
			throw new Error(`AI solver failed: ${errorMsg}`);
		}

		const response = result as AIResponse;
		const cleaned = cleanResponse(response.content);

		try {
			const solved = JSON.parse(cleaned);
			return NextResponse.json({
				solution: solved.solution,
				steps: solved.steps,
				provider: response.provider,
			});
		} catch {
			return NextResponse.json({
				solution: response.content,
				steps: [],
				provider: response.provider,
			});
		}
	} catch (error) {
		console.error("AI Solver error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to solve the problem",
			},
			{ status: 500 },
		);
	}
});
