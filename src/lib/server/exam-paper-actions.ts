"use server";

import { randomUUID } from "crypto";
import { UTApi, UTFile } from "uploadthing/server";
import {
	getAllExamPapers as getAllExamPapersFromDb,
	getExamPaperCount,
	getExamPapersBySubject,
	getExamsDb,
	insertExamPaper,
	saveExamsDb,
} from "@/lib/db/exams";

export interface ParsedExamPaperFilename {
	subjectCode: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName: string;
}

export interface UploadExamPaperOptions {
	filePath?: string;
	fileContent?: Buffer;
	subjectCode?: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName?: string;
}

export interface ExamPaperRecord {
	id: string;
	subjectId: string;
	subjectCode: string;
	subjectName: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	memoId: string | null;
	fileUrl: string;
	fileKey: string;
	originalFileName: string;
	uploadedAt: string;
}

function normalizeSubjectCode(code: string): string {
	return code.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function parseExamPaperFilename(
	filename: string,
): ParsedExamPaperFilename | null {
	const match = filename.match(/^(\d{4})_([a-z-]+)_p(\d+)(_memo)?\.pdf$/i);
	if (!match) return null;

	return {
		year: parseInt(match[1], 10),
		subjectCode: match[2],
		paperNumber: parseInt(match[3], 10),
		type: match[4] ? "memo" : "paper",
		originalFileName: filename,
	};
}

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
	return values.map((row) => {
		const obj: Record<string, unknown> = {};
		columns.forEach((col, i) => {
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
		const parsed = parseExamPaperFilename(originalFileName);
		if (!parsed) {
			throw new Error(`Could not parse filename: ${originalFileName}`);
		}
		subjectCode = normalizeSubjectCode(parsed.subjectCode);
		subjectName = toTitleCase(subjectCode);
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
		const fs = await import("fs/promises");
		fileBuffer = await fs.readFile(filePath!);
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
		fileKey: record.file_key as string,
		originalFileName: record.original_file_name as string,
		uploadedAt: record.uploaded_at as string,
	};
}

export async function getExamPapers(
	subjectCode: string,
	year?: number,
): Promise<ExamPaperRecord[]> {
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
		fileKey: r.file_key as string,
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
	const db = await getExamsDb();
	const record = dbExecOne(
		db,
		"SELECT file_url FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = ? LIMIT 1",
		[subjectCode, year, paperNumber, type],
	);

	return (record?.file_url as string) || null;
}

export async function deleteExamPaper(id: string): Promise<void> {
	const db = await getExamsDb();
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

export interface GetAllExamPapersOptions {
	year?: number;
	subjectCode?: string;
	type?: "paper" | "memo";
}

export async function getAllExamPapers(
	options?: GetAllExamPapersOptions,
): Promise<ExamPaperRecord[]> {
	const db = await getExamsDb();
	let query =
		"SELECT id, subject_code, subject_name, year, paper_number, type, memo_id, file_url, file_key, original_file_name, uploaded_at FROM exam_papers WHERE 1=1";
	const params: unknown[] = [];

	if (options?.year) {
		query += " AND year = ?";
		params.push(options.year);
	}
	if (options?.subjectCode) {
		query += " AND subject_code = ?";
		params.push(options.subjectCode);
	}
	if (options?.type) {
		query += " AND type = ?";
		params.push(options.type);
	}

	query += " ORDER BY subject_code, year DESC, paper_number";

	const records = dbExecAll(db, query, params);

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
		fileKey: r.file_key as string,
		originalFileName: r.original_file_name as string,
		uploadedAt: r.uploaded_at as string,
	}));
}

export async function getExamPapersWithFallback() {
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
					fileKey: record.file_key,
				};
			});
		}

		return null;
	} catch {
		return null;
	}
}

export async function checkAndPopulateExamsDb() {
	try {
		const count = getExamPaperCount();

		if (count > 0) {
			return { populated: false, count };
		}

		const examData = await import("@/data/exams/index.json");
		const exams = examData.default.exams as {
			id: string;
			subject: string;
			subjectId: string;
			year: number;
			session: string;
			type: string;
			paperNumber: number;
			language?: string;
			title: string;
			url: string;
		}[];

		if (!exams || exams.length === 0) {
			return { populated: false, count: 0 };
		}

		const db = await getExamsDb();

		for (const exam of exams) {
			db.run(
				`INSERT OR IGNORE INTO exam_papers (
					id, subject_code, subject_name, year, paper_number,
					type, file_url, file_key, original_file_name
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					exam.id,
					exam.subjectId,
					exam.subject,
					exam.year,
					exam.paperNumber,
					exam.type,
					exam.url,
					"",
					exam.title,
				],
			);
		}
		saveExamsDb();

		return { populated: true, count: exams.length };
	} catch (error) {
		console.error("Error checking/populating exams DB:", error);
		return { populated: false, count: 0, error: String(error) };
	}
}
