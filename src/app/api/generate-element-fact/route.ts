import { NextRequest, NextResponse } from "next/server";
import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

interface GenerateFactRequest {
	element: {
		atomicNumber: number;
		name: string;
		symbol: string;
	};
}

async function generateInterestingFact(
	element: GenerateFactRequest["element"],
): Promise<string> {
	if (!isAIConfigured()) {
		// Return a static fact when AI is not configured
		return `${element.name} (${element.symbol}) is element number ${element.atomicNumber} on the periodic table. [FIXED]`;
	}

	const systemPrompt = `You are a chemistry expert with a passion for sharing fascinating, accurate, and engaging facts about chemical elements. Your facts should be:
  - Scientifically accurate
  - Interesting and engaging for learners
  - Concise (1-2 sentences)
  - Focused on unique properties, historical significance, or surprising applications
  - Free of speculation or unverified claims`;

	const prompt = `Share one interesting, fascinating fact about ${element.name} (symbol: ${element.symbol}, atomic number: ${element.atomicNumber}). Make it engaging and educational, suitable for students learning about the periodic table.`;

	const result = await generateWithSystem(systemPrompt, prompt, {
		temperature: 0.8,
		maxTokens: 150,
	});

	if ("available" in result && !result.available) {
		const errorMsg = "error" in result ? result.error : "Unknown error";
		throw new Error(`AI generation failed: ${errorMsg}`);
	}

	const response = result as AIResponse;
	const cleanedContent = response.content
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.replace(/^[\s\S]*?[.!?]/, (match) => match.trim())
		.trim();

	// Ensure we return a clean fact
	if (!cleanedContent || cleanedContent.length < 10) {
		throw new Error("Generated fact is too short or empty");
	}

	return cleanedContent;
}

export async function POST(req: NextRequest) {
	// Initialize AI if not already configured
	if (!isAIConfigured()) {
		initAI({
			geminiApiKey: process.env.GEMINI_API_KEY,
			groqApiKey: process.env.GROQ_API_KEY,
			deepseekApiKey: process.env.DEEPSEEK_API_KEY,
		});
	}

	// If AI is still not configured, return service unavailable
	if (!isAIConfigured()) {
		return NextResponse.json(
			{
				error:
					"AI service not configured. Please set at least one AI provider API key.",
			},
			{ status: 503 },
		);
	}

	try {
		const body: GenerateFactRequest = await req.json();
		const { element } = body;

		if (!element || !element.name || !element.symbol) {
			return NextResponse.json(
				{ error: "Invalid element data" },
				{ status: 400 },
			);
		}

		const fact = await generateInterestingFact(element);

		return NextResponse.json({ fact });
	} catch (error) {
		console.error("Error generating element fact:", error);
		return NextResponse.json(
			{ error: "Failed to generate interesting fact" },
			{ status: 500 },
		);
	}
}
