"use server";

import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Query } from "node-appwrite";
import { UTApi, UTFile } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { parseExamPaperFilename as parseExamPaperFilenameFromSchema } from "@/lib/exams/helpers";
import { auth } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";
import type { AppwriteExamPaperRecord } from "@/types/exam";

export interface UploadExamPaperOptions {
	filePath?: string;
	fileContent?: Buffer;
	subjectCode?: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName?: string;
}

export type ExamPaperRecord = AppwriteExamPaperRecord;

function toTitleCase(str: string): string {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function appwriteDocToRecord(doc: Record<string, unknown>): ExamPaperRecord {
	return {
		$id: doc.$id as string,
		subject: doc.subject as string,
		subjectCode: doc.subjectCode as string,
		subjectName: doc.subjectName as string,
		paperCode: doc.paperCode as string,
		paperNumber: doc.paperNumber as number,
		examPeriod: doc.examPeriod as string,
		year: doc.year as number,
		grade: doc.grade as number,
		language: doc.language as string,
		totalMarks: doc.totalMarks as number,
		duration: doc.duration as string,
		type: doc.type as "paper" | "memo",
		memoId: doc.memoId as string | null,
		fileKeys: doc.fileKeys as string,
		fileUrl: doc.fileUrl as string,
		originalFileName: doc.originalFileName as string,
		uploadedAt: doc.uploadedAt as string,
		uploadedBy: doc.uploadedBy as string,
	};
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

	const fileUrl = uploadResult.data.ufsUrl;
	const fileKey = uploadResult.data.key;

	// Check for existing paper in Appwrite
	const existing = await databases.listDocuments(
		APPWRITE_DATABASE_ID,
		COLLECTIONS.EXAM_PAPERS,
		[
			Query.equal("subjectCode", subjectCode),
			Query.equal("year", year),
			Query.equal("paperNumber", paperNumber),
			Query.equal("type", type),
		],
	);

	if (existing.documents.length > 0) {
		throw new Error("Exam paper already exists");
	}

	const id = randomUUID();

	const docData: Record<string, unknown> = {
		subject: subjectName,
		subjectCode,
		subjectName,
		paperCode: `${subjectCode}-p${paperNumber}`,
		paperNumber,
		examPeriod: paperNumber > 2 ? "may-june" : "november",
		year,
		grade: 12,
		language: "english",
		totalMarks: 150,
		duration: "3 hours",
		type,
		memoId: null,
		fileKeys: JSON.stringify([fileKey]),
		fileUrl,
		originalFileName: fileName,
		uploadedAt: new Date().toISOString(),
		uploadedBy: _userId,
	};

	// If uploading a memo, link it to the corresponding paper
	if (type === "memo") {
		const paperDocs = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			[
				Query.equal("subjectCode", subjectCode),
				Query.equal("year", year),
				Query.equal("paperNumber", paperNumber),
				Query.equal("type", "paper"),
			],
		);

		if (paperDocs.documents.length > 0) {
			const paperId = paperDocs.documents[0].$id;
			docData.memoId = paperId;
			// Update paper to reference this memo
			await databases.updateDocument(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.EXAM_PAPERS,
				paperId,
				{ memoId: id },
			);
		}
	}

	await databases.createDocument(
		APPWRITE_DATABASE_ID,
		COLLECTIONS.EXAM_PAPERS,
		id,
		docData,
	);

	const doc = await databases.getDocument(
		APPWRITE_DATABASE_ID,
		COLLECTIONS.EXAM_PAPERS,
		id,
	);

	return appwriteDocToRecord(doc as unknown as Record<string, unknown>);
}

export async function getExamPapers(
	subjectCode: string,
	year?: number,
): Promise<ExamPaperRecord[]> {
	const _userId = await auth();

	const queries: string[] = [Query.equal("subjectCode", subjectCode)];
	if (year) {
		queries.push(Query.equal("year", year));
	}

	const response = await databases.listDocuments(
		APPWRITE_DATABASE_ID,
		COLLECTIONS.EXAM_PAPERS,
		queries,
	);

	return response.documents.map((doc) =>
		appwriteDocToRecord(doc as unknown as Record<string, unknown>),
	);
}

export async function getExamPaperUrl(
	subjectCode: string,
	year: number,
	paperNumber: number,
	type: "paper" | "memo",
): Promise<string | null> {
	const [_userId, response] = await Promise.all([
		auth(),
		databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_PAPERS, [
			Query.equal("subjectCode", subjectCode),
			Query.equal("year", year),
			Query.equal("paperNumber", paperNumber),
			Query.equal("type", type),
			Query.limit(1),
		]),
	]);

	return (response.documents[0]?.fileUrl as string) || null;
}

export async function deleteExamPaper(id: string): Promise<void> {
	const [_userId, doc] = await Promise.all([
		auth(),
		databases.getDocument(APPWRITE_DATABASE_ID, COLLECTIONS.EXAM_PAPERS, id),
	]);

	if (!doc) {
		throw new Error("Exam paper not found");
	}

	const utapi = new UTApi();

	// Delete associated file keys from UploadThing
	const rawKeys = doc.fileKeys as string | undefined;
	if (rawKeys) {
		try {
			const keys = JSON.parse(rawKeys) as string[];
			await utapi.deleteFiles(keys);
		} catch {
			// fileKeys may already be parsed or in single-key format
			if (typeof rawKeys === "string" && rawKeys.length > 0) {
				await utapi.deleteFiles(rawKeys);
			}
		}
	}

	await databases.deleteDocument(
		APPWRITE_DATABASE_ID,
		COLLECTIONS.EXAM_PAPERS,
		id,
	);
}

export async function getExamPapersWithFallback() {
	const _userId = await auth();
	try {
		const response = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			[Query.orderDesc("year"), Query.limit(100)],
		);

		if (response.documents.length === 0) {
			return null;
		}

		return response.documents.map((doc) => {
			const docRecord = doc as unknown as Record<string, unknown>;
			const paperNumber = docRecord.paperNumber as number | undefined;
			const session = paperNumber && paperNumber > 2 ? "may-june" : "november";

			return {
				id: docRecord.$id as string,
				subject: docRecord.subjectName as string,
				subjectId: docRecord.subjectCode as string,
				year: docRecord.year as number,
				session: session as "november" | "may-june",
				type: (docRecord.type as string) || "paper",
				paperNumber: docRecord.paperNumber as number | undefined,
				title: `${toTitleCase(docRecord.subjectCode as string)} P${docRecord.paperNumber} (${docRecord.year})`,
				url: docRecord.fileUrl as string,
				localPath: undefined,
				downloadedAt: docRecord.uploadedAt as string | undefined,
				src: undefined,
				fileUrl: docRecord.fileUrl as string,
				fileKey: null,
			};
		});
	} catch (err) {
		logError("ExamPaperActions", err);
		return null;
	}
}
