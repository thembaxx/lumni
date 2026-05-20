import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import { UTApi, UTFile } from "uploadthing/server";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";

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
			url: result.data.ufsUrl || result.data.url,
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

export async function POST(request: NextRequest) {
	try {
		await requireAdmin();

		const body: DownloadRequest = await request.json();
		const { year, examTypes, includeMemo, subjectIds } = body;

		const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
			Query.equal("code", subjectIds.join(",")),
		]);

		const errors: string[] = [];
		const results: { subject: string; papers: number; status: string }[] = [];

		const taskResults = await Promise.all(
			examTypes.flatMap((examType) => {
				const session = examType === "november" ? "november" : "may-june";
				return subjects.map(async (subj) => {
					const paperNumbers = examType === "november" ? [1, 2] : [1];

					const paperResults = await Promise.all(
						paperNumbers.map(async (paperNum) => {
							const fileName = `${year}_${examType}_${(subj as Record<string, unknown>).code}_p${paperNum}.pdf`;
							const memoFileName = `${year}_${examType}_${(subj as Record<string, unknown>).code}_p${paperNum}_memo.pdf`;

							let paperDownloaded = 0;
							const localErrors: string[] = [];

							const examInfo = await findExamPaperUrl(
								(subj as Record<string, unknown>).name as string,
								year,
								paperNum,
								"paper",
								session,
							);

							if (examInfo) {
								const pdfData = await downloadPdf(examInfo.url);

								if (pdfData) {
									const uploadResult = await uploadToUploadThing(
										pdfData.buffer,
										fileName,
									);

									if (uploadResult) {
										const saved = await saveToDatabase(
											(subj as Record<string, unknown>).$id as string,
											year,
											paperNum,
											"paper",
											uploadResult.url,
											uploadResult.key,
											fileName,
										);

										if (saved) {
											paperDownloaded++;
										}
									} else {
										localErrors.push(
											`${(subj as Record<string, unknown>).name} ${examType} P${paperNum}: Upload to server failed`,
										);
									}
								} else {
									localErrors.push(
										`${(subj as Record<string, unknown>).name} ${examType} P${paperNum}: Could not download PDF`,
									);
								}
							} else {
								localErrors.push(
									`${(subj as Record<string, unknown>).name} ${examType} P${paperNum}: No source URL found`,
								);
							}

							if (includeMemo) {
								const memoInfo = await findExamPaperUrl(
									(subj as Record<string, unknown>).name as string,
									year,
									paperNum,
									"memo",
									session,
								);

								if (memoInfo) {
									const memoData = await downloadPdf(memoInfo.url);

									if (memoData) {
										const uploadResult = await uploadToUploadThing(
											memoData.buffer,
											memoFileName,
										);

										if (uploadResult) {
											const saved = await saveToDatabase(
												(subj as Record<string, unknown>).$id as string,
												year,
												paperNum,
												"memo",
												uploadResult.url,
												uploadResult.key,
												memoFileName,
											);

											if (saved) {
												paperDownloaded++;
											}
										} else {
											localErrors.push(
												`${(subj as Record<string, unknown>).name} ${examType} Memo P${paperNum}: Upload to server failed`,
											);
										}
									} else {
										localErrors.push(
											`${(subj as Record<string, unknown>).name} ${examType} Memo P${paperNum}: Could not download PDF`,
										);
									}
								} else {
									localErrors.push(
										`${(subj as Record<string, unknown>).name} ${examType} Memo P${paperNum}: No source URL found`,
									);
								}
							}

							return { paperDownloaded, localErrors };
						}),
					);

					const downloadedForSubj = paperResults.reduce(
						(sum, r) => sum + r.paperDownloaded,
						0,
					);
					const allErrors = paperResults.flatMap((r) => r.localErrors);
					return { subj, downloadedForSubj, allErrors };
				});
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

		return NextResponse.json({
			success: true,
			downloaded,
			message:
				downloaded > 0
					? `Successfully downloaded ${downloaded} exam papers`
					: "Could not download any papers - source may be unavailable",
			results,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Download error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Download failed",
			},
			{ status: 500 },
		);
	}
}
