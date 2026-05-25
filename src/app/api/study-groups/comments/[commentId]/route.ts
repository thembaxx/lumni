import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { deleteComment } from "@/lib/study-groups/service";

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ commentId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { commentId } = await params;
	const result = await deleteComment(userId, commentId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 400 });
	}
	return NextResponse.json({ success: true });
}
