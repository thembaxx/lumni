import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { leaveGroup } from "@/lib/study-groups/service";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId } = await params;
	const result = await leaveGroup(userId, groupId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 400 });
	}
	return NextResponse.json({ success: true });
}
