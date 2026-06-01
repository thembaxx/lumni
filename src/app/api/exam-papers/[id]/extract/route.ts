import { UTApi } from "uploadthing/server";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { extractQuestionsFromPaper } from "@/lib/exam-paper-ingestion/question-extractor";
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

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "ExtractQuestions",
	execute: async ({ params }) => {
		const id = params?.id as string;

		const doc = await databases.getDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			id,
		);
		if (!doc) {
			throw new HttpError(404, "Paper not found");
		}

		const subject = (doc.subject as string) || "";
		const year = (doc.year as number) || 0;
		const paperNumberStr = (doc.paperCode as string) || "1";
		const paperNumber = parseInt(paperNumberStr.replace(/\D/g, ""), 10) || 1;

		const paper = await fetchParsedPaper(id);
		if (!paper) {
			throw new HttpError(502, "Could not fetch parsed paper JSON");
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
						userId: null,
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

		return {
			success: true,
			extracted: questions.length,
			stored,
		};
	},
});
