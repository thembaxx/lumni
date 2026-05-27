import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { getInterGroupLeaderboard } from "@/lib/study-groups/challenge-service";

export async function GET() {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const result = await getInterGroupLeaderboard();

	if (!result.success) {
		return NextResponse.json({ error: result.error }, { status: 500 });
	}

	return NextResponse.json({ leaderboard: result.data });
}
