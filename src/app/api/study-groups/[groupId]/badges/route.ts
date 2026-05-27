import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getGroupBadges } from "@/lib/study-groups/challenge-service";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId } = await params;
	const result = await getGroupBadges(groupId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}

	return NextResponse.json({ badges: result.data });
}
