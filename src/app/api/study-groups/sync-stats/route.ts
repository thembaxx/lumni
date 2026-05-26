import { type NextRequest, NextResponse } from "next/server";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import type { GroupMember } from "@/lib/study-groups/types";

export async function POST(_request: NextRequest) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await _request.json();
		const questionsAnswered = body.questionsAnswered as number | undefined;
		const currentStreak = body.currentStreak as number | undefined;

		const memberships = await listDocuments<GroupMember>(
			COLLECTIONS.GROUP_MEMBERS,
			[`userId=${userId}`],
		);

		await Promise.all(
			memberships.map((m) =>
				updateDocument(COLLECTIONS.GROUP_MEMBERS, m.$id, {
					...(questionsAnswered !== undefined && { questionsAnswered }),
					...(currentStreak !== undefined && { currentStreak }),
				}),
			),
		);

		return NextResponse.json({ success: true, synced: memberships.length });
	} catch {
		return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
	}
}
