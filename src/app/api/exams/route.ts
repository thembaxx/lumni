import { NextResponse } from "next/server";
import {
	getAllExamPapers,
	getExamPaperById,
	getExamPaperCount,
	getExamPapersBySubject,
} from "@/lib/db/exams";
import { ensureExamPapersSynced } from "@/lib/exams/sync-exam-papers";

export const runtime = "nodejs";

export async function GET(request: Request) {
	const { searchParams } = new URL(request.url);
	const subjectCode = searchParams.get("subject");
	const year = searchParams.get("year");
	const id = searchParams.get("id");

	try {
		if (id) {
			const paper = getExamPaperById(id);
			return NextResponse.json(paper);
		}

		if (subjectCode) {
			const papers = getExamPapersBySubject(
				subjectCode,
				year ? parseInt(year, 10) : undefined,
			);
			return NextResponse.json({ papers, count: papers.length });
		}

		const all = getAllExamPapers();
		return NextResponse.json({ papers: all, count: all.length });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to fetch exam papers",
			},
			{ status: 500 },
		);
	}
}
