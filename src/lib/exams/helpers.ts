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
