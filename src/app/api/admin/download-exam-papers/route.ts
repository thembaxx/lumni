import { randomUUID } from "crypto";
import { and, eq, inArray } from "drizzle-orm";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { UTApi, UTFile } from "uploadthing/server";
import { getDb } from "@/lib/db/client";
import { examPaper, subject } from "@/lib/db/schema";

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
		const filePath = path.join(process.cwd(), "data", "exams", "index.json");
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

	if (exam && exam.url) {
		return { url: exam.url, title: exam.title };
	}

	return null;
}

async function downloadPdf(
	url: string,
): Promise<{ buffer: Buffer; contentType: string } | null> {
	try {
		const response = await fetch(url, {
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
		const db = getDb();
		const id = randomUUID();

		await db.insert(examPaper).values({
			id,
			subjectId,
			year,
			paperNumber,
			type,
			fileUrl,
			fileKey,
			originalFileName,
		});

		if (type === "paper") {
			const existingMemo = await db
				.select({ id: examPaper.id })
				.from(examPaper)
				.where(
					and(
						eq(examPaper.subjectId, subjectId),
						eq(examPaper.year, year),
						eq(examPaper.paperNumber, paperNumber),
						eq(examPaper.type, "memo"),
					),
				)
				.limit(1);

			if (existingMemo.length > 0) {
				await db
					.update(examPaper)
					.set({ memoId: id })
					.where(eq(examPaper.id, existingMemo[0].id));
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
		const body: DownloadRequest = await request.json();
		const { year, examTypes, includeMemo, subjectIds } = body;

		const db = getDb();

		const subjects = await db
			.select()
			.from(subject)
			.where(inArray(subject.id, subjectIds));

		let downloaded = 0;
		const errors: string[] = [];
		const results: { subject: string; papers: number; status: string }[] = [];

		for (const examType of examTypes) {
			const session = examType === "november" ? "november" : "may-june";

			for (const subj of subjects) {
				const paperNumbers = examType === "november" ? [1, 2] : [1];
				let subjectPapersDownloaded = 0;

				for (const paperNum of paperNumbers) {
					const fileName = `${year}_${examType}_${subj.code}_p${paperNum}.pdf`;
					const memoFileName = `${year}_${examType}_${subj.code}_p${paperNum}_memo.pdf`;

					const examInfo = await findExamPaperUrl(
						subj.name,
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
									subj.id,
									year,
									paperNum,
									"paper",
									uploadResult.url,
									uploadResult.key,
									fileName,
								);

								if (saved) {
									downloaded++;
									subjectPapersDownloaded++;
								}
							} else {
								errors.push(
									`${subj.name} ${examType} P${paperNum}: Upload to server failed`,
								);
							}
						} else {
							errors.push(
								`${subj.name} ${examType} P${paperNum}: Could not download PDF`,
							);
						}
					} else {
						errors.push(
							`${subj.name} ${examType} P${paperNum}: No source URL found`,
						);
					}

					if (includeMemo) {
						const memoInfo = await findExamPaperUrl(
							subj.name,
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
										subj.id,
										year,
										paperNum,
										"memo",
										uploadResult.url,
										uploadResult.key,
										memoFileName,
									);

									if (saved) {
										downloaded++;
									}
								}
							}
						}
					}
				}

				results.push({
					subject: subj.name,
					papers: subjectPapersDownloaded,
					status: subjectPapersDownloaded > 0 ? "success" : "failed",
				});
			}
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
