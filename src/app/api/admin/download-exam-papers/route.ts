import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Query } from "appwrite";
import { UTApi, UTFile } from "uploadthing/server";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";

interface DownloadRequest {
	year: number;
	examTypes: string[];
	includeMemo: boolean;
	subjectIds: string[];
}

interface ExamPaperEntry {
	id: string;
	subject: string;
	subjectId: string;
	year: number;
	session: string;
	type: string;
	paperNumber: number;
	language: string;
	title: string;
	url: string;
	localPath: string | null;
	downloadedAt: string | null;
}

interface ExamsData {
	exams: ExamPaperEntry[];
}

function getExamsFromJson(
	year: number,
	session: string,
	subjectId: string,
): ExamPaperEntry[] {
	try {
		const filePath = path.resolve("data", "exams", "index.json");
		const content = fs.readFileSync(filePath, "utf-8");
		const data: ExamsData = JSON.parse(content);

		return data.exams.filter(
			(e) =>
				e.year === year && e.session === session && e.subjectId === subjectId,
		);
	} catch {
		return [];
	}
}

function normalizeSubjectToCode(subjectName: string): string {
	return subjectName
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}

async function processExamFlow(params: {
	subjectName: string;
	subjectId: string;
	year: number;
	paperNum: number;
	examType: string;
	type: "paper" | "memo";
	session: string;
	fileName: string;
}): Promise<{ downloaded: number; errors: string[] }> {
	const {
		subjectName,
		subjectId,
		year,
		paperNum,
		examType,
		type,
		session,
		fileName,
	} = params;

	const examInfo = await findExamPaperUrl(
		subjectName,
		year,
		paperNum,
		type,
		session,
	);

	if (!examInfo) {
		const label = type === "paper" ? `P${paperNum}` : `Memo P${paperNum}`;
		return {
			downloaded: 0,
			errors: [`${subjectName} ${examType} ${label}: No source URL found`],
		};
	}

	const pdfData = await downloadPdf(examInfo.url);
	if (!pdfData) {
		const label = type === "paper" ? `P${paperNum}` : `Memo P${paperNum}`;
		return {
			downloaded: 0,
			errors: [`${subjectName} ${examType} ${label}: Could not download PDF`],
		};
	}

	const uploadResult = await uploadToUploadThing(pdfData.buffer, fileName);
	if (!uploadResult) {
		const label = type === "paper" ? `P${paperNum}` : `Memo P${paperNum}`;
		return {
			downloaded: 0,
			errors: [`${subjectName} ${examType} ${label}: Upload to server failed`],
		};
	}

	const saved = await saveToDatabase(
		subjectId,
		year,
		paperNum,
		type,
		uploadResult.url,
		uploadResult.key,
		fileName,
	);

	if (!saved) {
		const label = type === "paper" ? `P${paperNum}` : `Memo P${paperNum}`;
		return {
			downloaded: 0,
			errors: [`${subjectName} ${examType} ${label}: Database save failed`],
		};
	}

	return { downloaded: 1, errors: [] };
}

async function findExamPaperUrl(
	subjectName: string,
	year: number,
	paperNumber: number,
	type: "paper" | "memo",
	session: string,
): Promise<{ url: string; title: string } | null> {
	const exams = getExamsFromJson(
		year,
		session,
		normalizeSubjectToCode(subjectName),
	);

	const exam = exams.find(
		(e) => e.paperNumber === paperNumber && e.type === type,
	);

	if (exam?.url) {
		return { url: exam.url, title: exam.title };
	}

	return null;
}

async function downloadPdf(
	url: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
	try {
		const response = await fetch(url, {
			cache: "no-store",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				Accept: "application/pdf,*/*",
			},
		});

		if (!response.ok) {
			return null;
		}

		const contentType =
			response.headers.get("content-type") || "application/pdf";
		const arrayBuffer = await response.arrayBuffer();

		return {
			buffer: Buffer.from(arrayBuffer),
			contentType,
		};
	} catch (error) {
		console.error("Download error:", error);
		return null;
	}
}

async function uploadToUploadThing(
	buffer: Buffer,
	fileName: string,
): Promise<{ url: string; key: string } | null> {
	try {
		const utApi = new UTApi();
		const uint8Array = new Uint8Array(buffer);
		const utFile = new UTFile([uint8Array], fileName);
		const result = await utApi.uploadFiles(utFile);

		if (!result?.data) {
			return null;
		}

		return {
			url: result.data.ufsUrl,
			key: result.data.key,
		};
	} catch (error) {
		console.error("UploadThing error:", error);
		return null;
	}
}

async function saveToDatabase(
	subjectId: string,
	year: number,
	paperNumber: number,
	type: "paper" | "memo",
	fileUrl: string,
	fileKey: string,
	originalFileName: string,
): Promise<boolean> {
	try {
		const id = randomUUID();

		await createDocument(COLLECTIONS.EXAM_PAPERS, {
			subjectId,
			year,
			paperNumber,
			type,
			fileUrl,
			fileKey,
			originalFileName,
		});

		if (type === "paper") {
			const existingMemo = await listDocuments(COLLECTIONS.EXAM_PAPERS, [
				Query.equal("subjectId", subjectId),
				Query.equal("year", year),
				Query.equal("paperNumber", paperNumber),
				Query.equal("type", "memo"),
				Query.limit(1),
			]);

			if (existingMemo.length > 0) {
				await updateDocument(
					COLLECTIONS.EXAM_PAPERS,
					(existingMemo[0] as Record<string, unknown>).$id as string,
					{
						memoId: id,
					},
				);
			}
		}

		return true;
	} catch (error) {
		console.error("Database save error:", error);
		return false;
	}
}

async function downloadSubjectPapers(params: {
	subject: unknown;
	examType: string;
	session: string;
	year: number;
	paperNumbers: number[];
	includeMemo: boolean | undefined;
}): Promise<{ downloadedForSubj: number; allErrors: string[] }> {
	const subjRecord = params.subject as Record<string, unknown>;
	const subjectName = subjRecord.name as string;
	const subjectId = subjRecord.$id as string;
	const subjectCode = subjRecord.code as string;

	const paperResults = await Promise.all(
		params.paperNumbers.map(async (paperNum) => {
			const fileName = `${params.year}_${params.examType}_${subjectCode}_p${paperNum}.pdf`;
			const memoFileName = `${params.year}_${params.examType}_${subjectCode}_p${paperNum}_memo.pdf`;

			const flows: Promise<{ downloaded: number; errors: string[] }>[] = [
				processExamFlow({
					subjectName,
					subjectId,
					year: params.year,
					paperNum,
					examType: params.examType,
					type: "paper",
					session: params.session,
					fileName,
				}),
			];

			if (params.includeMemo) {
				flows.push(
					processExamFlow({
						subjectName,
						subjectId,
						year: params.year,
						paperNum,
						examType: params.examType,
						type: "memo",
						session: params.session,
						fileName: memoFileName,
					}),
				);
			}

			const flowResults = await Promise.all(flows);
			const paperDownloaded = flowResults.reduce(
				(sum, r) => sum + r.downloaded,
				0,
			);
			const localErrors = flowResults.flatMap((r) => r.errors);
			return { paperDownloaded, localErrors };
		}),
	);

	const downloadedForSubj = paperResults.reduce(
		(sum, r) => sum + r.paperDownloaded,
		0,
	);
	const allErrors = paperResults.flatMap((r) => r.localErrors);
	return { downloadedForSubj, allErrors };
}

export const POST = createRouteHandler({
	auth: "admin",
	errorLabel: "DownloadExamPapers",
	validate: (body) => {
		const { year, examTypes, subjectIds } = body as unknown as DownloadRequest;
		if (!year || !examTypes || !subjectIds)
			return "year, examTypes, and subjectIds are required";
		return null;
	},
	execute: async ({ body }) => {
		const { year, examTypes, includeMemo, subjectIds } =
			body as unknown as DownloadRequest;

		const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
			Query.equal("code", subjectIds.join(",")),
		]);

		const errors: string[] = [];
		const results: { subject: string; papers: number; status: string }[] = [];

		const taskResults = await Promise.all(
			examTypes.flatMap((examType) => {
				const session = examType === "november" ? "november" : "may-june";
				return subjects.map((subj) =>
					downloadSubjectPapers({
						subject: subj,
						examType,
						session,
						year,
						paperNumbers: examType === "november" ? [1, 2] : [1],
						includeMemo,
					}).then((summary) => ({ subj, ...summary })),
				);
			}),
		);

		let downloaded = 0;
		for (const { subj, downloadedForSubj, allErrors } of taskResults) {
			errors.push(...allErrors);
			results.push({
				subject: (subj as Record<string, unknown>).name as string,
				papers: downloadedForSubj,
				status: allErrors.length === 0 ? "success" : "partial",
			});
			downloaded += downloadedForSubj;
		}

		return {
			success: true,
			downloaded,
			message:
				downloaded > 0
					? `Successfully downloaded ${downloaded} exam papers`
					: "Could not download any papers - source may be unavailable",
			results,
			errors: errors.length > 0 ? errors : undefined,
		};
	},
});
