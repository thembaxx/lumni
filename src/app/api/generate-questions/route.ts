import { NextRequest, NextResponse } from "next/server";
import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";
import type { QAQuestion } from "@/lib/types/questions";

export const dynamic = "force-dynamic";

interface GenerateQuestionsRequest {
	subject: string;
	topic?: string;
	count?: number;
	difficulty?: "Easy" | "Medium" | "Hard";
}

async function generateQuestionsWithAI(
	subject: string,
	topic: string,
	count: number,
	difficulty: string,
): Promise<QAQuestion[]> {
	const prompt = `Generate ${count} multiple choice questions for ${subject}${topic ? ` on the topic: ${topic}` : ""}.
Difficulty: ${difficulty}.
Return ONLY a JSON array with no surrounding text. Each question must have:
- id: string (unique like "q1", "q2")
- topic: string
- difficulty: "Easy" | "Medium" | "Hard" (match the requested difficulty)
- points: number (10 for Easy, 20 for Medium, 30 for Hard)
- questionText: string (the question)
- questionType: "multiple-choice"
- supportsDiagram: boolean
- diagram: null
- hint: string (a hint to help answer)
- explanation: string (why the answer is correct)

For options, each must have:
- id: "A" | "B" | "C" | "D"
- text: string (option text)
- isCorrect: boolean (exactly one correct per question)

Example format:
[{"id":"q1","topic":"${subject}","difficulty":"${difficulty}","points":${difficulty === "Easy" ? 10 : difficulty === "Medium" ? 20 : 30},"questionText":"...","questionType":"multiple-choice","options":[{"id":"A","text":"...","isCorrect":true},{"id":"B","text":"...","isCorrect":false},{"id":"C","text":"...","isCorrect":false},{"id":"D","text":"...","isCorrect":false}],"supportsDiagram":false,"diagram":null,"hint":"...","explanation":"..."}]`;

	const systemPrompt = `You are an expert educational question generator. Generate clear, accurate multiple choice questions. Return ONLY valid JSON array with no markdown formatting, no explanation text before or after. Start with [ and end with ].`;

	const result = await generateWithSystem(systemPrompt, prompt, {
		temperature: 0.8,
		maxTokens: count > 10 ? 12000 : 6000,
	});

	if ("available" in result && !result.available) {
		const errorMsg = "error" in result ? result.error : "Unknown error";
		throw new Error(`AI generation failed: ${errorMsg}`);
	}

	const response = result as AIResponse;
	const cleanedContent = response.content
		.replace(/```json/g, "")
		.replace(/```/g, "")
		.trim();

	try {
		const questions = JSON.parse(cleanedContent);
		if (!Array.isArray(questions)) {
			throw new Error("Response is not an array");
		}
		return questions as QAQuestion[];
	} catch (_parseError) {
		console.error("Failed to parse AI response:", cleanedContent);
		throw new Error("Failed to parse generated questions");
	}
}

export async function POST(req: NextRequest) {
	try {
		const body: GenerateQuestionsRequest = await req.json();
		const { subject, topic, count = 5, difficulty = "Medium" } = body;

		if (!subject) {
			return NextResponse.json(
				{ error: "Subject is required" },
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

		const questions = await generateQuestionsWithAI(
			subject,
			topic || "",
			count,
			difficulty,
		);

		return NextResponse.json({
			questions,
			provider: "gemini",
		});
	} catch (error) {
		console.error("Question generation error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to generate questions",
			},
			{ status: 500 },
		);
	}
}
