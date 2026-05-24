import { NextResponse } from "next/server";
import { examPaperIngestion } from "@/lib/exam-paper-ingestion";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		await requireAdmin();

		const { fileKey } = await request.json();
		if (!fileKey) {
			return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
		}

		const result = await examPaperIngestion.ingest({
			type: "upload-thing",
			fileKey,
		});

		return NextResponse.json({
			success: true,
			id: result.id,
			metadata: result.metadata,
		});
	} catch (error) {
		console.error("Exam upload error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to process exam paper",
			},
			{ status: 500 },
		);
	}
}
