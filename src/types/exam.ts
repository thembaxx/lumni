export type ExamSession = "november" | "may-june";

export type ExamPaperType = "paper" | "memo" | "answer-book";

export type ExamLanguage = "english" | "afrikaans";

export interface PaperListing {
	id: string;
	subject: string;
	subjectId: string;
	year: number;
	session: ExamSession;
	type: ExamPaperType;
	paperNumber?: number;
	language?: ExamLanguage;
	province?: string;
	title: string;
	url: string;
	localPath?: string;
	downloadedAt?: string;
	src?: string;
	fileUrl?: string;
	fileKey?: string;
}

export interface ExamFilter {
	search: string;
	year: number | null;
	subject: string | null;
	session: string;
	language?: string;
}

export interface ExamGroup {
	subject: string;
	papers: PaperListing[];
}

// --- ExamPaperRecord variants ---
// These intentionally differ per data store. Consolidated here as single source of truth.

/** Appwrite `exam_papers` collection record (db/client.ts). */
export interface AppwriteExamPaperRecord {
	$id: string;
	subject: string;
	paperCode: string;
	examPeriod: string;
	year: number;
	grade: number;
	language: string;
	totalMarks: number;
	duration: string;
	fileKeys: string;
	uploadedAt: string;
	uploadedBy: string;
}

/** Local SQLite `exam_papers` table record (db/exams/schema.ts). */
export interface LocalExamPaperRecord {
	id: string;
	subjectCode: string;
	subjectName: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	paperId: string | null;
	fileUrl: string;
	fileKey: string;
	originalFileName: string;
	uploadedAt: string;
}

/** Server-action return type (exam-paper-actions.ts). Adds memoId/subjectId. */
export interface ServerExamPaperRecord {
	id: string;
	subjectId: string;
	subjectCode: string;
	subjectName: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	memoId: string | null;
	fileUrl: string;
	fileKey: null;
	originalFileName: string;
	uploadedAt: string;
}
