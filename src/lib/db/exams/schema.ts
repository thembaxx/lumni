import type { LocalExamPaperRecord } from "@/types/exam";

// Re-exported from types/exam.ts (single source of truth). Shape intentionally differs
// from AppwriteExamPaperRecord (online) and ServerExamPaperRecord (server actions) because
// this is the local SQLite schema — different fields for offline file storage.
export type ExamPaperRecord = LocalExamPaperRecord;

export interface ParsedExamPaperFilename {
	subjectCode: string;
	subjectName: string;
	year: number;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName: string;
}

export function parseExamPaperFilename(
	filename: string,
): ParsedExamPaperFilename | null {
	const match = filename.match(/^(\d{4})_([a-z_-]+)(_p(\d+))?(_memo)?\.pdf$/i);
	if (!match) return null;

	const year = parseInt(match[1], 10);
	const rawSubject = match[2];
	const paperNumber = match[4] ? parseInt(match[4], 10) : 1;
	const type: "paper" | "memo" = match[5] ? "memo" : "paper";

	const subjectCode = rawSubject.replace(/_/g, "-");
	const subjectName = rawSubject
		.replace(/-/g, " ")
		.replace(/_/g, " ")
		.replace(/\b\w/g, (c) => c.toUpperCase());

	return {
		year,
		subjectCode,
		subjectName,
		paperNumber,
		type,
		originalFileName: filename,
	};
}

const SUBJECT_NAME_MAP: Record<string, string> = {
	accounting: "Accounting",
	"agricultural-management-practices": "Agricultural Management Practices",
	"agricultural-sciences": "Agricultural Sciences",
	"agricultural-technology": "Agricultural Technology",
	"business-studies": "Business Studies",
	"computer-applications-technology": "Computer Applications Technology",
	"consumer-studies": "Consumer Studies",
	"dramatic-arts": "Dramatic Arts",
	economics: "Economics",
	"engineering-graphics-and-design": "Engineering Graphics and Design",
	geography: "Geography",
	history: "History",
	"information-technology": "Information Technology",
	"life-sciences": "Life Sciences",
	mathematics: "Mathematics",
	"physical-sciences": "Physical Sciences",
	tourism: "Tourism",
	"visual-arts": "Visual Arts",
};

export function getSubjectName(code: string): string {
	return (
		SUBJECT_NAME_MAP[code] ??
		code.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
	);
}
