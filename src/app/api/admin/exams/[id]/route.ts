import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";

const utapi = new UTApi();

export async function DELETE(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAdmin();

		const { id } = await params;

		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			id,
		);

		if (!doc) {
			return NextResponse.json(
				{ error: "Exam paper not found" },
				{ status: 404 },
			);
		}

		const fileKeysRaw = doc.fileKeys as string;
		const fileKeys: Record<string, string> = fileKeysRaw
			? JSON.parse(fileKeysRaw)
			: {};
		const keysToDelete = Object.values(fileKeys).filter(Boolean);

		if (keysToDelete.length > 0) {
			await utapi.deleteFiles(keysToDelete);
		}

		await databases.deleteDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			id,
		);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Failed to delete exam:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to delete exam",
			},
			{ status: 500 },
		);
	}
}
