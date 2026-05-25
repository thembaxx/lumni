import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { createGroup, getGroupsForUser } from "@/lib/study-groups/service";

export async function GET() {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await getGroupsForUser(userId);
	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}
	return NextResponse.json({ groups: result.data });
}

export async function POST(request: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const result = await createGroup(userId, {
			name: body.name,
			description: body.description,
			subjectId: body.subjectId,
		});

		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}
		return NextResponse.json({ group: result.data }, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}
}
