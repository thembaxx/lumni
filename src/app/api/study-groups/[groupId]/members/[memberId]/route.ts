import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { removeMember } from "@/lib/study-groups/service";

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string; memberId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId, memberId } = await params;
	const result = await removeMember(userId, groupId, memberId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 400 });
	}
	return NextResponse.json({ success: true });
}
