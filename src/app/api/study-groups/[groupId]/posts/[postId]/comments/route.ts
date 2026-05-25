import { type NextRequest, NextResponse } from "next/server";
import {
	getAuthenticatedUserId,
	getAuthenticatedUserName,
} from "@/lib/server/auth";
import {
	getPostComments,
	createComment,
} from "@/lib/study-groups/service";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string; postId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { postId } = await params;
	const result = await getPostComments(postId);

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}
	return NextResponse.json({ comments: result.data });
}

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
		if (!body.content || typeof body.content !== "string") {
			return NextResponse.json({ error: "Content is required" }, { status: 400 });
		}

		const userName = await getAuthenticatedUserName();
		const result = await createComment(
			userId,
			userName ?? undefined,
			postId,
			body.content,
			body.parentId,
		);

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}
		return NextResponse.json({ comment: result.data }, { status: 201 });
	} catch {
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
	}
}
