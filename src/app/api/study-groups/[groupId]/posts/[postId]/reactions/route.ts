import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { togglePostReaction } from "@/lib/study-groups/service";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ groupId: string; postId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { postId } = await params;

	try {
		const body = await request.json();
		if (!body.emoji || typeof body.emoji !== "string") {
			return NextResponse.json({ error: "Emoji is required" }, { status: 400 });
		}

		const result = await togglePostReaction(userId, postId, body.emoji);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}
		return NextResponse.json({ reaction: result.data });
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
	}
}
