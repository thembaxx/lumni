import fs from "node:fs";
import path from "node:path";
import { Query } from "appwrite";
import { uploadToUploadThing } from "@/lib/admin/upload-shared";
import {
	COLLECTIONS,
	createDocument,
	listDocuments,
	type Subject,
	updateDocument,
} from "@/lib/db/client";

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

export interface DownloadRequest {
	year: number;
	examTypes: string[];
	includeMemo: boolean;
	subjectIds: string[];
}

interface DownloadResult {
	subject: string;
	papers: number;
	status: string;
}

interface DownloadResponse {
	success: boolean;
	downloaded: number;
	message: string;
	results: DownloadResult[];
	errors?: string[];
}

export class ExamDownloadService {
	private getExamsFromJson(
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

	private normalizeSubjectToCode(subjectName: string): string {
		return subjectName
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-|-$/g, "");
	}

	private findExamPaperUrl(
		subjectName: string,
		year: number,
		paperNumber: number,
		type: "paper" | "memo",
		session: string,
	): { url: string; title: string } | null {
		const exams = this.getExamsFromJson(
			year,
			session,
			this.normalizeSubjectToCode(subjectName),
		);
		const exam = exams.find(
			(e) => e.paperNumber === paperNumber && e.type === type,
		);
		if (exam?.url) return { url: exam.url, title: exam.title };
		return null;
	}

	private async downloadPdf(
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
			if (!response.ok) return null;
			const contentType =
				response.headers.get("content-type") || "application/pdf";
			const arrayBuffer = await response.arrayBuffer();
			return { buffer: Buffer.from(arrayBuffer), contentType };
		} catch {
			return null;
		}
	}

	private async saveToDatabase(
		subjectId: string,
		year: number,
		paperNumber: number,
		type: "paper" | "memo",
		fileUrl: string,
		fileKey: string,
		originalFileName: string,
	): Promise<boolean> {
		try {
			const id = await createDocument(COLLECTIONS.EXAM_PAPERS, {
				subjectId,
				year,
				paperNumber,
				type,
				fileUrl,
				fileKey,
				originalFileName,
			});
			if (type === "paper") {
				const existingMemo = await listDocuments<{
					$id: string;
				}>(COLLECTIONS.EXAM_PAPERS, [
					Query.equal("subjectId", subjectId),
					Query.equal("year", year),
					Query.equal("paperNumber", paperNumber),
					Query.equal("type", "memo"),
					Query.limit(1),
				]);
				if (existingMemo.length > 0) {
					await updateDocument(COLLECTIONS.EXAM_PAPERS, existingMemo[0].$id, {
						memoId: id,
					});
				}
			}
			return true;
		} catch {
			return false;
		}
	}

	private async processExamFlow(params: {
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
		const label = type === "paper" ? `P${paperNum}` : `Memo P${paperNum}`;

		const examInfo = this.findExamPaperUrl(
			subjectName,
			year,
			paperNum,
			type,
			session,
		);
		if (!examInfo) {
			return {
				downloaded: 0,
				errors: [`${subjectName} ${examType} ${label}: No source URL found`],
			};
		}

		const pdfData = await this.downloadPdf(examInfo.url);
		if (!pdfData) {
			return {
				downloaded: 0,
				errors: [`${subjectName} ${examType} ${label}: Could not download PDF`],
			};
		}

		const uploadResult = await uploadToUploadThing(
			new Uint8Array(pdfData.buffer),
			fileName,
		);
		if (!uploadResult) {
			return {
				downloaded: 0,
				errors: [
					`${subjectName} ${examType} ${label}: Upload to server failed`,
				],
			};
		}

		const saved = await this.saveToDatabase(
			subjectId,
			year,
			paperNum,
			type,
			uploadResult.url,
			uploadResult.key,
			fileName,
		);
		if (!saved) {
			return {
				downloaded: 0,
				errors: [`${subjectName} ${examType} ${label}: Database save failed`],
			};
		}

		return { downloaded: 1, errors: [] };
	}

	private async downloadSubjectPapers(params: {
		subject: Subject;
		examType: string;
		session: string;
		year: number;
		paperNumbers: number[];
		includeMemo: boolean | undefined;
	}): Promise<{ downloadedForSubj: number; allErrors: string[] }> {
		const {
			subject: subj,
			examType,
			session,
			year,
			paperNumbers,
			includeMemo,
		} = params;

		const paperResults = await Promise.all(
			paperNumbers.map(async (paperNum) => {
				const fileName = `${year}_${examType}_${subj.code}_p${paperNum}.pdf`;
				const memoFileName = `${year}_${examType}_${subj.code}_p${paperNum}_memo.pdf`;

				const flows: Promise<{ downloaded: number; errors: string[] }>[] = [
					this.processExamFlow({
						subjectName: subj.name,
						subjectId: subj.$id,
						year,
						paperNum,
						examType,
						type: "paper",
						session,
						fileName,
					}),
				];

				if (includeMemo) {
					flows.push(
						this.processExamFlow({
							subjectName: subj.name,
							subjectId: subj.$id,
							year,
							paperNum,
							examType,
							type: "memo",
							session,
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

	async download(request: DownloadRequest): Promise<DownloadResponse> {
		const { year, examTypes, includeMemo, subjectIds } = request;

		if (subjectIds.length === 0) {
			return {
				success: true,
				downloaded: 0,
				message: "No subjects specified",
				results: [],
			};
		}

		const subjectQueries = subjectIds.flatMap((id) => [
			Query.equal("code", id),
		]);
		const subjects = await listDocuments<Subject>(COLLECTIONS.SUBJECTS, [
			...(subjectQueries.length > 1
				? [Query.or(subjectQueries)]
				: subjectQueries),
		]);

		const errors: string[] = [];
		const results: DownloadResult[] = [];

		const taskResults = await Promise.all(
			examTypes.flatMap((examType) => {
				const session = examType === "november" ? "november" : "may-june";
				return subjects.map((subj) =>
					this.downloadSubjectPapers({
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
				subject: subj.name,
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
	}
}
