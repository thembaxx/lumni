import { type NextRequest, NextResponse } from "next/server";
import {
	getAuthenticatedUserId,
	getAuthenticatedUserName,
} from "@/lib/server/auth";
import {
	createPost,
	getGroupMembers,
	getGroupPosts,
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
	const isMember =
		membersResult.success &&
		membersResult.data.some((m) => m.userId === userId);
	if (!isMember) {
		return NextResponse.json(
			{ error: "Not a member of this group" },
			{ status: 403 },
		);
	}

	const result = await getGroupPosts(groupId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}
	return NextResponse.json({ posts: result.data });
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ groupId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId } = await params;

	const membersResult = await getGroupMembers(groupId);
	const isMember =
		membersResult.success &&
		membersResult.data.some((m) => m.userId === userId);
	if (!isMember) {
		return NextResponse.json(
			{ error: "Not a member of this group" },
			{ status: 403 },
		);
	}

	try {
		const body = await request.json();
		const userName = await getAuthenticatedUserName();

		const result = await createPost(userId, userName ?? undefined, {
			groupId,
			content: body.content,
			questionText: body.questionText,
			subject: body.subject,
			topic: body.topic,
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}
		return NextResponse.json({ post: result.data }, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}
}
