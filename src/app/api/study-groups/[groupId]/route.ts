import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	deleteGroup,
	getGroupById,
	getGroupMembers,
} from "@/lib/study-groups/service";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId } = await params;

	const membersResult = await getGroupMembers(groupId);
	const members = membersResult.success ? membersResult.data : [];
	const isMember = members.some((m) => m.userId === userId);
	if (!isMember) {
		return NextResponse.json(
			{ error: "Not a member of this group" },
			{ status: 403 },
		);
	}

	const groupResult = await getGroupById(groupId);
	if (!groupResult.success) {
		return NextResponse.json({ error: groupResult.error }, { status: 404 });
	}

	return NextResponse.json({ group: groupResult.data, members });
}

export async function DELETE(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId } = await params;
	const result = await deleteGroup(userId, groupId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 400 });
	}
	return NextResponse.json({ success: true });
}
