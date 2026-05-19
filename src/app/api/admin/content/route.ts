import { Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";

export async function GET() {
	try {
		await requireAdmin();

		const flags = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.QUESTION_FLAGS,
			[Query.orderDesc("createdAt"), Query.limit(100)],
		);

		return NextResponse.json({ flags });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch flags",
			},
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		await requireAdmin();

		const body = await request.json();
		const { flagId, status } = body;

		if (!flagId || !status) {
			return NextResponse.json(
				{ error: "flagId and status are required" },
				{ status: 400 },
			);
		}

		const validStatuses = ["pending", "resolved", "dismissed"];
		if (!validStatuses.includes(status)) {
			return NextResponse.json(
				{ error: `status must be one of: ${validStatuses.join(", ")}` },
				{ status: 400 },
			);
		}

		await updateDocument(COLLECTIONS.QUESTION_FLAGS, flagId, {
			status,
			updatedAt: new Date().toISOString(),
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to update flag",
			},
			{ status: 500 },
		);
	}
}
