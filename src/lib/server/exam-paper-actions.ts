"use server";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { UTApi, UTFile } from "uploadthing/server";
import {
	getAllExamPapers as getAllExamPapersFromDb,
	getExamPapersBySubject,
	getExamsDb,
	insertExamPaper,
	saveExamsDb,
} from "@/lib/db/exams";
import { parseExamPaperFilename as parseExamPaperFilenameFromSchema } from "@/lib/db/exams/schema";
import { auth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";
import type { ServerExamPaperRecord } from "@/types/exam";

export interface UploadExamPaperOptions {
	filePath?: string;
	fileContent?: Buffer;
	subjectCode?: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName?: string;
}

// Re-exported from types/exam.ts (single source of truth). Shape intentionally differs
// from AppwriteExamPaperRecord (online) and LocalExamPaperRecord (SQLite) because this
// is the server action return type — adds memoId/subjectId for upload workflows.
export type ExamPaperRecord = ServerExamPaperRecord;

function toTitleCase(str: string): string {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function dbExecAll(
	db: Awaited<ReturnType<typeof getExamsDb>>,
	sql: string,
	args?: unknown[],
): Record<string, unknown>[] {
	const result = db.exec(sql, args as (string | number | null | Uint8Array)[]);
	if (!result || result.length === 0 || !result[0].values) return [];
	const { columns, values } = result[0];
	return values.map((row: unknown[]) => {
		const obj: Record<string, unknown> = {};
		columns.forEach((col: string, i: number) => {
			obj[col] = row[i];
		});
		return obj;
	});
}

function dbExecOne(
	db: Awaited<ReturnType<typeof getExamsDb>>,
	sql: string,
	args?: unknown[],
): Record<string, unknown> | undefined {
	const rows = dbExecAll(db, sql, args);
	return rows[0];
}

export async function uploadExamPaper(
	options: UploadExamPaperOptions,
): Promise<ExamPaperRecord> {
	const _userId = await auth();

	const utapi = new UTApi();

	const {
		filePath,
		fileContent,
		subjectCode: providedSubjectCode,
		year,
		paperNumber,
		type,
		originalFileName,
	} = options;

	if (!fileContent && !filePath) {
		throw new Error("Either filePath or fileContent must be provided");
	}

	let subjectCode = providedSubjectCode;
	let subjectName = "";

	if (!subjectCode && originalFileName) {
		const parsed = parseExamPaperFilenameFromSchema(originalFileName);
		if (!parsed) {
			throw new Error(`Could not parse filename: ${originalFileName}`);
		}
		subjectCode = parsed.subjectCode;
		subjectName = parsed.subjectName;
	}

	if (!subjectCode) {
		throw new Error("subjectCode is required");
	}

	if (!subjectName) {
		subjectName = toTitleCase(subjectCode);
	}

	let fileBuffer: Buffer;
	if (fileContent) {
		fileBuffer = fileContent;
	} else {
		fileBuffer = await readFile(filePath ?? "");
	}

	const bufferObj = Buffer.from(
		fileBuffer.buffer.slice(
			fileBuffer.byteOffset,
			fileBuffer.byteOffset + fileBuffer.byteLength,
		),
	);

	const uint8Array = new Uint8Array(bufferObj);
	const fileName = originalFileName || `exam_paper_${Date.now()}.pdf`;
	const utFile = new UTFile([uint8Array], fileName);

	const uploadResult = await utapi.uploadFiles(utFile);

	if (!uploadResult?.data) {
		throw new Error(uploadResult?.error?.message || "Upload failed");
	}

	const fileUrl = uploadResult.data.ufsUrl || uploadResult.data.url;
	const fileKey = uploadResult.data.key;

	const id = randomUUID();

	const db = await getExamsDb();
	const existingPapers = dbExecAll(
		db,
		"SELECT id FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = ?",
		[subjectCode, year, paperNumber, type],
	);

	if (existingPapers.length > 0) {
		throw new Error("Exam paper already exists");
	}

	insertExamPaper({
		id,
		subjectCode,
		subjectName,
		year,
		paperNumber,
		type,
		paperId: null,
		fileUrl,
		fileKey,
		originalFileName: fileName,
	});

	if (type === "memo") {
		const paperResult = dbExecOne(
			db,
			"SELECT id FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'paper' LIMIT 1",
			[subjectCode, year, paperNumber],
		);

		if (paperResult) {
			db.run("UPDATE exam_papers SET memo_id = ? WHERE id = ?", [
				id,
				paperResult.id as string,
			]);
			saveExamsDb();
		}
	}

	const record = dbExecOne(
		db,
		"SELECT id, subject_code, subject_name, year, paper_number, type, memo_id, file_url, file_key, original_file_name, uploaded_at FROM exam_papers WHERE id = ?",
		[id],
	);

	if (!record) {
		throw new Error("Failed to retrieve uploaded exam paper");
	}

	return {
		id: record.id as string,
		subjectId: record.subject_code as string,
		subjectCode: record.subject_code as string,
		subjectName: record.subject_name as string,
		year: record.year as number,
		paperNumber: record.paper_number as number,
		type: record.type as "paper" | "memo",
		memoId: record.memo_id as string | null,
		fileUrl: record.file_url as string,
		fileKey: null,
		originalFileName: record.original_file_name as string,
		uploadedAt: record.uploaded_at as string,
	};
}

export async function getExamPapers(
	subjectCode: string,
	year?: number,
): Promise<ExamPaperRecord[]> {
	const _userId = await auth();
	const records = year
		? getExamPapersBySubject(subjectCode, year)
		: getExamPapersBySubject(subjectCode);

	return records.map((r) => ({
		id: r.id as string,
		subjectId: r.subject_code as string,
		subjectCode: r.subject_code as string,
		subjectName: r.subject_name as string,
		year: r.year as number,
		paperNumber: r.paper_number as number,
		type: r.type as "paper" | "memo",
		memoId: r.memo_id as string | null,
		fileUrl: r.file_url as string,
		fileKey: null,
		originalFileName: r.original_file_name as string,
		uploadedAt: r.uploaded_at as string,
	}));
}

export async function getExamPaperUrl(
	subjectCode: string,
	year: number,
	paperNumber: number,
	type: "paper" | "memo",
): Promise<string | null> {
	const [_userId, db] = await Promise.all([auth(), getExamsDb()]);
	const record = dbExecOne(
		db,
		"SELECT file_url FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = ? LIMIT 1",
		[subjectCode, year, paperNumber, type],
	);

	return (record?.file_url as string) || null;
}

export async function deleteExamPaper(id: string): Promise<void> {
	const [_userId, db] = await Promise.all([auth(), getExamsDb()]);
	const utapi = new UTApi();

	const record = dbExecOne(
		db,
		"SELECT file_key FROM exam_papers WHERE id = ?",
		[id],
	);

	if (!record) {
		throw new Error("Exam paper not found");
	}

	await utapi.deleteFiles(record.file_key as string);

	db.run("DELETE FROM exam_papers WHERE id = ?", [id]);
	saveExamsDb();
}

export async function getExamPapersWithFallback() {
	const _userId = await auth();
	try {
		const dbRecords = getAllExamPapersFromDb() as {
			id: string;
			subject_code: string;
			subject_name: string;
			year: number;
			paper_number: number;
			type: "paper" | "memo";
			file_url: string;
			file_key: string;
			original_file_name: string;
			uploaded_at: string;
		}[];

		if (dbRecords && dbRecords.length > 0) {
			return dbRecords.map((record) => {
				const session =
					record.paper_number && record.paper_number > 2
						? "may-june"
						: "november";

				return {
					id: record.id,
					subject: record.subject_name,
					subjectId: record.subject_code,
					year: record.year,
					session: session as "november" | "may-june",
					type: record.type,
					paperNumber: record.paper_number,
					title: `${toTitleCase(record.subject_code)} P${record.paper_number} (${record.year})`,
					url: record.file_url,
					localPath: undefined,
					downloadedAt: record.uploaded_at,
					src: undefined,
					fileUrl: record.file_url,
					fileKey: null,
				};
			});
		}

		return null;
	} catch (err) {
		logError("ExamPaperActions", err);
		return null;
	}
}
