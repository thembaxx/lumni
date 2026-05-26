import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	getCommentReactions,
	toggleCommentReaction,
} from "@/lib/study-groups/service";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ commentId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { commentId } = await params;
	const result = await getCommentReactions(commentId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}
	return NextResponse.json({ reactions: result.data });
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ commentId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { commentId } = await params;

	try {
		const body = await request.json();
		if (!body.emoji || typeof body.emoji !== "string") {
			return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
		}

		const result = await toggleCommentReaction(userId, commentId, body.emoji);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}
		return NextResponse.json({ reaction: result.data });
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}
}
