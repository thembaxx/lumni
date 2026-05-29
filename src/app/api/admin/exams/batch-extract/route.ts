import { type NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import {
	APPWRITE_DATABASE_ID,
	COLLECTIONS,
	createDocument,
	listDocuments,
} from "@/lib/db/client";
import { extractQuestionsFromPaper } from "@/lib/exam-paper-ingestion/question-extractor";
import { requireAdmin } from "@/lib/server/auth";
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

export async function POST(request: NextRequest) {
	try {
		await requireAdmin();

		const body = await request.json().catch(() => ({}));
		const paperIds: string[] = body.paperIds;

		const _filters = paperIds?.length
			? ([undefined, paperIds] as const)
			: ([undefined, undefined] as const);

		const rawPapers = (await listDocuments(
			COLLECTIONS.EXAM_PAPERS,
			[],
		)) as Record<string, unknown>[];

		const papersToExtract = paperIds?.length
			? rawPapers.filter((p) => paperIds.includes(p.$id as string))
			: rawPapers;

		const results: {
			paperId: string;
			subject: string;
			status: "success" | "skipped" | "error";
			extracted?: number;
			error?: string;
		}[] = [];

		const docResults = await Promise.all(
			papersToExtract.map(async (doc) => {
				const docId = doc.$id as string;
				const fileKeysRaw = doc.fileKeys as string;
				const fileKeys: Record<string, string> = fileKeysRaw
					? JSON.parse(fileKeysRaw)
					: {};

				if (!fileKeys.json) {
					return {
						paperId: docId,
						subject: (doc.subject as string) || "",
						status: "skipped" as const,
						error: "No JSON file available",
					};
				}

				try {
					const subject = (doc.subject as string) || "";
					const year = (doc.year as number) || 0;
					const paperNumberStr = (doc.paperCode as string) || "1";
					const paperNumber =
						parseInt(paperNumberStr.replace(/\D/g, ""), 10) || 1;

					const paper = await fetchParsedPaper(docId);
					if (!paper) {
						return {
							paperId: docId,
							subject,
							status: "error" as const,
							error: "Failed to fetch parsed JSON",
						};
					}

					const questions = extractQuestionsFromPaper(
						paper,
						null,
						subject,
						year,
						paperNumber,
					);

					await Promise.allSettled(
						questions.map((q) =>
							createDocument(
								COLLECTIONS.PAST_PAPER_QUESTIONS,
								q as unknown as Record<string, unknown>,
							).catch(() => {}),
						),
					);

					return {
						paperId: docId,
						subject,
						status: "success" as const,
						extracted: questions.length,
					};
				} catch (err) {
					return {
						paperId: docId,
						subject: (doc.subject as string) || "",
						status: "error" as const,
						error: err instanceof Error ? err.message : "Unknown error",
					};
				}
			}),
		);
		results.push(...docResults);

		return NextResponse.json({
			success: true,
			total: papersToExtract.length,
			results,
		});
	} catch (error) {
		console.error("Batch extract error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Batch extract failed",
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	try {
		await requireAdmin();

		const docs = (await listDocuments(COLLECTIONS.EXAM_PAPERS, [])) as Record<
			string,
			unknown
		>[];

		const papers = docs.map((doc) => {
			const fileKeysRaw = doc.fileKeys as string;
			const fileKeys: Record<string, string> = fileKeysRaw
				? JSON.parse(fileKeysRaw)
				: {};
			return {
				id: doc.$id as string,
				subject: doc.subject as string,
				paperCode: doc.paperCode as string,
				year: doc.year as number,
				hasJson: !!fileKeys.json,
			};
		});

		return NextResponse.json({ papers });
	} catch (_error) {
		return NextResponse.json({ error: "Failed" }, { status: 500 });
	}
}
