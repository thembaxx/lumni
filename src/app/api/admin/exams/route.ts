import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";

export async function GET() {
	try {
		await requireAdmin();

		const response = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
		);

		const exams = response.documents.map((doc) => ({
			id: doc.$id,
			subject: doc.subject,
			paperCode: doc.paperCode,
			examPeriod: doc.examPeriod,
			year: doc.year,
			grade: doc.grade,
			language: doc.language,
			totalMarks: doc.totalMarks,
			duration: doc.duration,
			fileKeys: doc.fileKeys ? JSON.parse(doc.fileKeys as string) : null,
			uploadedAt: doc.uploadedAt,
		}));

		return NextResponse.json({ exams, total: exams.length });
	} catch (error) {
		console.error("Failed to list exams:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to list exams",
			},
			{ status: 500 },
		);
	}
}
