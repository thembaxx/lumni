import { type NextRequest, NextResponse } from "next/server";
import { CHAT_SYSTEM_PROMPT, generateWithSystem } from "@/lib/ai/client";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const handler = async (request: NextRequest) => {
	try {
		const {
			allowed,
			response: budgetResponse,
			userId,
		} = await checkBudget(request, "generate");
		if (!allowed) {
			return (
				budgetResponse ??
				NextResponse.json(
					{ error: "Budget response unavailable" },
					{ status: 500 },
				)
			);
		}

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

		trackUsage("generate", userId);

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
};

export const POST = withRateLimit(handler);
