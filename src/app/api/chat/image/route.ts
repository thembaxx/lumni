import { NextRequest, NextResponse } from "next/server";
import { generateWithSystem } from "@/lib/ai/client";

const CHAT_SYSTEM_PROMPT = `You are a helpful study assistant and tutor. Your role is to help students understand their subjects, answer questions, explain concepts, and provide guidance on their studies. Be friendly, encouraging, and patient. Use clear explanations with examples when helpful. If you don't know something, admit it and try to help them find the answer.`;

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { imageUrl, imageName } = body;

		if (!imageUrl) {
			return NextResponse.json({ error: "No image provided" }, { status: 400 });
		}

		const userPrompt = imageName
			? `Please analyze this image (${imageName}) and help me with any questions I might have about it.`
			: "Please analyze this image and help me with any questions I might have about it.";

		const result = await generateWithSystem(CHAT_SYSTEM_PROMPT, userPrompt, {
			temperature: 0.7,
			maxTokens: 1024,
			imageUrl,
		});

		if (!("available" in result) || !result.available) {
			const errorResult = result as { error?: string };
			return NextResponse.json(
				{
					error:
						errorResult.error ||
						"AI service is currently unavailable. Please try again.",
				},
				{ status: 503 },
			);
		}

		const content = (result as { content?: string }).content;

		return NextResponse.json({
			content: content || "I can see your image. How can I help you with it?",
			provider: result.provider,
		});
	} catch (error) {
		console.error("[/api/chat/image] Error:", error);

		if (error instanceof SyntaxError) {
			return NextResponse.json(
				{ error: "Invalid request format" },
				{ status: 400 },
			);
		}

		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "An unexpected error occurred. Please try again.",
			},
			{ status: 500 },
		);
	}
}
