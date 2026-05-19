import { type NextRequest, NextResponse } from "next/server";
import { apiError } from "@/lib/api-error";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const runtime = "nodejs";

async function examsHandler(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const subjectCode = searchParams.get("subject");
	const year = searchParams.get("year");
	const id = searchParams.get("id");

	try {
		if (id) {
			const doc = await databases.getDocument(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.EXAM_PAPERS,
				id,
			);
			if (!doc) {
				return apiError("Exam paper not found", 404);
			}
			return NextResponse.json({
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
			});
		}

		const queries: string[] = [];
		if (subjectCode) {
			queries.push(`subject=${subjectCode}`);
		}
		if (year) {
			queries.push(`year=${year}`);
		}

		const response = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			queries,
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
			uploadedAt: doc.uploadedAt,
		}));

		return NextResponse.json({ papers: exams, count: exams.length });
	} catch {
		return apiError("Failed to fetch exams", 500);
	}
}

export const GET = withRateLimit(examsHandler, {
	max: 15,
	windowMs: 60000,
});
