import { NextResponse } from "next/server";
import { getExamPaperCount } from "@/lib/db/exams";
import {
	ensureExamPapersSynced,
	isSyncCompleted,
} from "@/lib/exams/sync-exam-papers";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST() {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}
		const count = getExamPaperCount();
		if (count === 0) {
			await ensureExamPapersSynced();
		}
		const newCount = getExamPaperCount();
		return NextResponse.json({
			synced: true,
			count: newCount,
			wasEmpty: count === 0,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Sync failed" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required" },
				{ status: 401 },
			);
		}
		await ensureExamPapersSynced();
		const count = getExamPaperCount();
		const completed = isSyncCompleted();
		return NextResponse.json({ count, synced: completed });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Sync failed" },
			{ status: 500 },
		);
	}
}
