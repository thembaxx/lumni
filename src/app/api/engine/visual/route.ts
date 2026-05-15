import { NextRequest, NextResponse } from "next/server";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { VisualEngine, visualEngine } from "@/lib/visual-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
	try {
		const budget = await checkBudget(req, "visual");
		if (!budget.allowed) return budget.response;

		VisualEngine.initialize();

		const body = (await req.json()) as {
			questionId: string;
			questionText: string;
			subject: string;
			topic?: string;
		};

		if (!body.questionId || !body.questionText || !body.subject) {
			return NextResponse.json(
				{ error: "questionId, questionText, and subject are required" },
				{ status: 400 },
			);
		}

		const visual = await visualEngine.resolve({
			questionId: body.questionId,
			questionText: body.questionText,
			subject: body.subject,
			topic: body.topic || "",
		});

		trackUsage("visual", budget.userId);

		return NextResponse.json({ visual });
	} catch (error) {
		console.error("[Visual Engine] Error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to resolve visual content",
			},
			{ status: 500 },
		);
	}
}
