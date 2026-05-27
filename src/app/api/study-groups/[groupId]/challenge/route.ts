import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	getChallengeEntries,
	getOrCreateChallenge,
} from "@/lib/study-groups/challenge-service";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ groupId: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { groupId } = await params;

	const challengeResult = await getOrCreateChallenge(groupId);
	if (!challengeResult.success) {
		return NextResponse.json({ error: challengeResult.error }, { status: 500 });
	}

	const entriesResult = await getChallengeEntries(challengeResult.data.$id);
	const entries = entriesResult.success ? entriesResult.data : [];

	return NextResponse.json({
		challenge: challengeResult.data,
		entries,
	});
}
