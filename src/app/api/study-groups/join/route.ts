import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { joinGroup } from "@/lib/study-groups/service";

export async function POST(request: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { inviteCode } = body;

		if (!inviteCode || typeof inviteCode !== "string") {
			return NextResponse.json(
				{ error: "Invite code is required" },
				{ status: 400 },
			);
		}

		const result = await joinGroup(userId, inviteCode.toUpperCase());
		if (!result.success) {
			return NextResponse.json({ error: result.error }, { status: 400 });
		}
		return NextResponse.json({ group: result.data });
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}
}
