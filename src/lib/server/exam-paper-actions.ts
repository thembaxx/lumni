import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { UTApi, UTFile } from "uploadthing/server";
import { getDb } from "@/lib/db/client";
import { examPaper, subject as subjectTable } from "@/lib/db/schema";

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
	subjectId?: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName?: string;
}

export interface ExamPaperRecord {
	id: string;
	subjectId: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	memoId: string | null;
	fileUrl: string;
	fileKey: string;
	originalFileName: string;
	uploadedAt: Date;
}

function normalizeSubjectCode(filename: string): string {
	return filename.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
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

async function findOrCreateSubject(
	db: ReturnType<typeof getDb>,
	subjectCode: string,
) {
	const normalizedCode = normalizeSubjectCode(subjectCode);
	const normalizedName = subjectCode
		.replace(/-/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());

	const existing = await db
		.select()
		.from(subjectTable)
		.where(eq(subjectTable.code, normalizedCode))
		.limit(1);

	if (existing.length > 0) {
		return existing[0];
	}

	const id = randomUUID();
	await db.insert(subjectTable).values({
		id,
		name: normalizedName,
		code: normalizedCode,
		category: "general", // Default category
	});

	return { id, name: normalizedName, code: normalizedCode };
}

export async function uploadExamPaper(
	options: UploadExamPaperOptions,
): Promise<ExamPaperRecord> {
	const db = getDb();
	const utapi = new UTApi();

	const {
		filePath,
		fileContent,
		subjectId: providedSubjectId,
		year,
		paperNumber,
		type,
		originalFileName,
	} = options;

	if (!fileContent && !filePath) {
		throw new Error("Either filePath or fileContent must be provided");
	}

	let subjectId = providedSubjectId;

	if (!subjectId && originalFileName) {
		const parsed = parseExamPaperFilename(originalFileName);
		if (!parsed) {
			throw new Error(`Could not parse filename: ${originalFileName}`);
		}

		const subjectRecord = await findOrCreateSubject(db, parsed.subjectCode);
		subjectId = subjectRecord.id;
	}

	if (!subjectId) {
		throw new Error("subjectId is required");
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

	await db.insert(examPaper).values({
		id,
		subjectId,
		year,
		paperNumber,
		type,
		fileUrl,
		fileKey,
		originalFileName: fileName,
	});

	if (type === "memo") {
		const questionPaper = await db
			.select()
			.from(examPaper)
			.where(
				and(
					eq(examPaper.subjectId, subjectId),
					eq(examPaper.year, year),
					eq(examPaper.paperNumber, paperNumber),
					eq(examPaper.type, "paper"),
				),
			)
			.limit(1);

		if (questionPaper.length > 0) {
			await db
				.update(examPaper)
				.set({ memoId: questionPaper[0].id })
				.where(eq(examPaper.id, id));
		}
	}

	const record = await db
		.select()
		.from(examPaper)
		.where(eq(examPaper.id, id))
		.limit(1);

	return record[0] as ExamPaperRecord;
}

export async function getExamPapers(
	subjectId: string,
	year?: number,
): Promise<ExamPaperRecord[]> {
	const db = getDb();

	const conditions = [eq(examPaper.subjectId, subjectId)];
	if (year) {
		conditions.push(eq(examPaper.year, year));
	}

	const records = await db
		.select()
		.from(examPaper)
		.where(and(...conditions));

	return records as ExamPaperRecord[];
}

export async function getExamPaperUrl(
	subjectId: string,
	year: number,
	paperNumber: number,
	type: "paper" | "memo",
): Promise<string | null> {
	const db = getDb();

	const records = await db
		.select()
		.from(examPaper)
		.where(
			and(
				eq(examPaper.subjectId, subjectId),
				eq(examPaper.year, year),
				eq(examPaper.paperNumber, paperNumber),
				eq(examPaper.type, type),
			),
		)
		.limit(1);

	return records[0]?.fileUrl || null;
}

export async function deleteExamPaper(id: string): Promise<void> {
	const db = getDb();
	const utapi = new UTApi();

	const records = await db
		.select()
		.from(examPaper)
		.where(eq(examPaper.id, id))
		.limit(1);

	if (records.length === 0) {
		throw new Error("Exam paper not found");
	}

	const fileKey = records[0].fileKey;
	await utapi.deleteFiles(fileKey);

	await db.delete(examPaper).where(eq(examPaper.id, id));
}

export async function getSubjectByCode(code: string) {
	const db = getDb();
	const normalizedCode = normalizeSubjectCode(code);

	const records = await db
		.select()
		.from(subjectTable)
		.where(eq(subjectTable.code, normalizedCode))
		.limit(1);

	return records[0] || null;
}
