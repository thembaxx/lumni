import Database from "better-sqlite3";
import { join } from "path";

type DatabaseType = InstanceType<typeof Database>;

let db: DatabaseType | null = null;

export function resetExamsDb() {
	if (db) {
		db.close();
	}
	db = null;
}

export function getExamsDb(): DatabaseType {
	if (db) return db;

	const dbPath = join(process.cwd(), "exams.db");
	db = new Database(dbPath);
	db.exec("PRAGMA journal_mode = WAL");
	db.exec("PRAGMA foreign_keys = ON");

	db.exec(`
		CREATE TABLE IF NOT EXISTS exam_papers (
			id TEXT PRIMARY KEY,
			subject_code TEXT NOT NULL,
			subject_name TEXT NOT NULL,
			year INTEGER NOT NULL,
			paper_number INTEGER NOT NULL,
			type TEXT NOT NULL CHECK(type IN ('paper', 'memo')),
			paper_id TEXT,
			memo_id TEXT,
			file_url TEXT NOT NULL,
			file_key TEXT NOT NULL,
			original_file_name TEXT NOT NULL,
			uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (paper_id) REFERENCES exam_papers(id),
			FOREIGN KEY (memo_id) REFERENCES exam_papers(id)
		);

		CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_papers_unique
			ON exam_papers(subject_code, year, paper_number, type);
		CREATE INDEX IF NOT EXISTS idx_exam_papers_subject_code
			ON exam_papers(subject_code);
		CREATE INDEX IF NOT EXISTS idx_exam_papers_subject_year
			ON exam_papers(subject_code, year);
	`);

	// Migration: add unique index if it doesn't exist (existing DBs won't have it)
	try {
		db.exec(
			"CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_papers_unique ON exam_papers(subject_code, year, paper_number, type)",
		);
	} catch {
		// Index already exists — ignore
	}

	// Migration: add memo_id if it doesn't exist (existing DBs won't have it)
	try {
		db.exec("ALTER TABLE exam_papers ADD COLUMN memo_id TEXT");
	} catch {
		// Column already exists — ignore
	}

	return db;
}

export function getExamPaperCount(): number {
	const db = getExamsDb();
	const result = db
		.prepare("SELECT COUNT(*) as count FROM exam_papers")
		.get() as { count: number };
	return result.count;
}

export function getAllExamPapers() {
	const db = getExamsDb();
	return db
		.prepare(
			"SELECT * FROM exam_papers ORDER BY subject_code, year DESC, paper_number",
		)
		.all();
}

export function getExamPapersBySubject(subjectCode: string, year?: number) {
	const db = getExamsDb();
	if (year) {
		return db
			.prepare(
				"SELECT * FROM exam_papers WHERE subject_code = ? AND year = ? ORDER BY paper_number",
			)
			.all(subjectCode, year);
	}
	return db
		.prepare(
			"SELECT * FROM exam_papers WHERE subject_code = ? ORDER BY year DESC, paper_number",
		)
		.all(subjectCode);
}

export function getExamPaperById(id: string) {
	const db = getExamsDb();
	return db.prepare("SELECT * FROM exam_papers WHERE id = ?").get(id);
}

export function insertExamPaper(record: {
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
}) {
	const db = getExamsDb();

	// Check for existing exam paper to prevent duplicates
	const existing =
		record.type === "paper"
			? findPaperForMemo(record.subjectCode, record.year, record.paperNumber)
			: findMemoForPaper(record.subjectCode, record.year, record.paperNumber);

	if (existing) {
		return; // Skip duplicate
	}

	db.prepare(
		`INSERT INTO exam_papers (
			id, subject_code, subject_name, year, paper_number,
			type, paper_id, file_url, file_key, original_file_name
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
	).run(
		record.id,
		record.subjectCode,
		record.subjectName,
		record.year,
		record.paperNumber,
		record.type,
		record.paperId,
		record.fileUrl,
		record.fileKey,
		record.originalFileName,
	);
}

export function updateExamPaperMemoLink(paperId: string, memoId: string) {
	const db = getExamsDb();
	db.prepare(
		"UPDATE exam_papers SET memo_id = ? WHERE id = ? AND type = 'paper'",
	).run(memoId, paperId);
}

export function updateExamPaperPaperLink(memoId: string, paperId: string) {
	const db = getExamsDb();
	db.prepare(
		"UPDATE exam_papers SET paper_id = ? WHERE id = ? AND type = 'memo'",
	).run(paperId, memoId);
}

export function findPaperForMemo(
	subjectCode: string,
	year: number,
	paperNumber: number,
): string | null {
	const db = getExamsDb();
	const result = db
		.prepare(
			"SELECT id FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'paper' LIMIT 1",
		)
		.get(subjectCode, year, paperNumber) as { id: string } | undefined;
	return result?.id ?? null;
}

export function findMemoForPaper(
	subjectCode: string,
	year: number,
	paperNumber: number,
): string | null {
	const db = getExamsDb();
	const result = db
		.prepare(
			"SELECT id FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'memo' LIMIT 1",
		)
		.get(subjectCode, year, paperNumber) as { id: string } | undefined;
	return result?.id ?? null;
}
