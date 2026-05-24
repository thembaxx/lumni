import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import type { ExamPaper as ExamPaperData } from "@/types/exam-paper";

export const runtime = "nodejs";

const utapi = new UTApi();

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
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

		if (!fileKeys.json) {
			return NextResponse.json(
				{ error: "Parsed exam JSON not available" },
				{ status: 404 },
			);
		}

		const urlResult = await utapi.getFileUrls([fileKeys.json]);
		const urlData = urlResult.data || [];
		if (!urlData.length || !urlData[0]?.url) {
			return NextResponse.json(
				{ error: "Exam JSON file not found on UploadThing" },
				{ status: 404 },
			);
		}

		const response = await fetch(urlData[0].url, { cache: "no-store" });
		if (!response.ok) {
			return NextResponse.json(
				{ error: "Failed to fetch exam JSON" },
				{ status: 502 },
			);
		}

		const examPaper: ExamPaperData = await response.json();

		return NextResponse.json({
			metadata: {
				id: doc.$id,
				subject: doc.subject,
				paperCode: doc.paperCode,
				examPeriod: doc.examPeriod,
				year: doc.year,
				grade: doc.grade,
				language: doc.language,
				totalMarks: doc.totalMarks,
				duration: doc.duration,
			},
			exam: examPaper,
		});
	} catch (error) {
		console.error("Failed to fetch exam paper:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to fetch exam paper",
			},
			{ status: 500 },
		);
	}
}
