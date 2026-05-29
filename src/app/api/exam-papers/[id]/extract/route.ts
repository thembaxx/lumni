import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { extractQuestionsFromPaper } from "@/lib/exam-paper-ingestion/question-extractor";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import type { ExamPaper } from "@/types/exam-paper";

export const runtime = "nodejs";

const utapi = new UTApi();

async function fetchParsedPaper(id: string): Promise<ExamPaper | null> {
	try {
		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			id,
		);
		const fileKeysRaw = doc.fileKeys as string;
		const fileKeys: Record<string, string> = fileKeysRaw
			? JSON.parse(fileKeysRaw)
			: {};
		if (!fileKeys.json) return null;
		const urlResult = await utapi.getFileUrls([fileKeys.json]);
		const urlData = urlResult.data || [];
		if (!urlData.length || !urlData[0]?.url) return null;
		const response = await fetch(urlData[0].url, { cache: "no-store" });
		if (!response.ok) return null;
		return (await response.json()) as ExamPaper;
	} catch {
		return null;
	}
}

export async function POST(
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
			return NextResponse.json({ error: "Paper not found" }, { status: 404 });
		}

		const subject = (doc.subject as string) || "";
		const year = (doc.year as number) || 0;
		const paperNumberStr = (doc.paperCode as string) || "1";
		const paperNumber = parseInt(paperNumberStr.replace(/\D/g, ""), 10) || 1;

		const paper = await fetchParsedPaper(id);
		if (!paper) {
			return NextResponse.json(
				{ error: "Could not fetch parsed paper JSON" },
				{ status: 502 },
			);
		}

		const memoId = (doc.memoId as string) || "";
		let memo: ExamPaper | null = null;
		if (memoId) {
			memo = await fetchParsedPaper(memoId);
		}

		const questions = extractQuestionsFromPaper(
			paper,
			memo,
			subject,
			year,
			paperNumber,
		);

		const dbLib = await import("@/lib/db/client");

		const stored: string[] = [];
		const results = await Promise.allSettled(
			questions.map((q) =>
				dbLib
					.createDocument(dbLib.COLLECTIONS.PAST_PAPER_QUESTIONS, {
						...q,
						userId,
					})
					.then(() => q.id),
			),
		);
		for (const r of results) {
			if (r.status === "fulfilled") stored.push(r.value);
		}

		try {
			const { offlineDB } = await import("@/lib/db/schema");
			await offlineDB.pastPaperQuestions.bulkPut(questions);
		} catch {
			// Dexie unavailable server-side
		}

		return NextResponse.json({
			success: true,
			extracted: questions.length,
			stored,
		});
	} catch (error) {
		console.error("Extract error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Extraction failed",
			},
			{ status: 500 },
		);
	}
}
