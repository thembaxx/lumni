import { NextRequest, NextResponse } from "next/server";
import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/utils/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0] ||
		req.headers.get("x-real-ip") ||
		"unknown";

	const rateLimit = checkRateLimit(ip);

	if (!rateLimit.allowed) {
		return NextResponse.json(
			{
				error: "Rate limit exceeded",
				message: `Too many requests. Please wait ${Math.ceil((rateLimit.resetAt - Date.now()) / 1000)} seconds.`,
			},
			{
				status: 429,
				headers: getRateLimitHeaders(rateLimit),
			},
		);
	}

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
		const cleanedContent = response.content
			.replace(/```json/g, "")
			.replace(/```/g, "")
			.trim();

		try {
			const solved = JSON.parse(cleanedContent);
			return NextResponse.json({
				solution: solved.solution,
				steps: solved.steps,
				provider: response.provider,
			});
		} catch (_parseError) {
			console.error("Failed to parse AI response:", cleanedContent);
			// Fallback if not JSON
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
}
