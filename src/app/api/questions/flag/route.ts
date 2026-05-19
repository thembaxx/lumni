import { NextRequest, NextResponse } from "next/server";
import { enqueue } from "@/lib/orchestrator/job-queue";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function POST(request: NextRequest) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}

		const body = await request.json();
		const { questionId, reason, details } = body;

		if (!questionId || !reason) {
			return NextResponse.json(
				{ error: "questionId and reason are required" },
				{ status: 400 },
			);
		}

		const validReasons = ["wrong", "offensive", "broken", "other"];
		if (!validReasons.includes(reason)) {
			return NextResponse.json(
				{ error: `reason must be one of: ${validReasons.join(", ")}` },
				{ status: 400 },
			);
		}

		await enqueue("appwrite-question-flag", {
			questionId,
			userId,
			reason,
			details: details || "",
			createdAt: Date.now(),
		});

		return NextResponse.json({ success: true }, { status: 201 });
	} catch (error) {
		console.error("Flag question error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to flag question",
			},
			{ status: 500 },
		);
	}
}
