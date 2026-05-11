import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import initSqlJs, { type Database } from "sql.js";

let db: Database | null = null;
let dbPath: string = "";

export function resetExamsDb() {
	if (db) {
		db.close();
	}
	db = null;
	dbPath = "";
}

async function initSql(): Promise<Database> {
	const SQL = await initSqlJs();
	const targetPath = join(process.cwd(), "exams.db");

	if (existsSync(targetPath)) {
		const buffer = readFileSync(targetPath);
		db = new SQL.Database(buffer);
	} else {
		db = new SQL.Database();
	}

	db.run("PRAGMA journal_mode = WAL");
	db.run("PRAGMA foreign_keys = ON");

	db.run(`
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
		)
	`);

	db.run(
		"CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_papers_unique ON exam_papers(subject_code, year, paper_number, type)",
	);
	db.run(
		"CREATE INDEX IF NOT EXISTS idx_exam_papers_subject_code ON exam_papers(subject_code)",
	);
	db.run(
		"CREATE INDEX IF NOT EXISTS idx_exam_papers_subject_year ON exam_papers(subject_code, year)",
	);

	try {
		db.run("ALTER TABLE exam_papers ADD COLUMN memo_id TEXT");
	} catch {
		// Column already exists
	}

	dbPath = targetPath;
	return db;
}

let initPromise: Promise<Database> | null = null;

export async function getExamsDb(): Promise<Database> {
	if (db) return db;
	if (!initPromise) {
		initPromise = initSql();
	}
	return initPromise;
}

export function saveExamsDb() {
	if (db && dbPath) {
		const data = db.export();
		const buffer = Buffer.from(data);
		writeFileSync(dbPath, buffer);
	}
}

export function getExamPaperCount(): number {
	if (!db) return 0;
	const result = db.exec(
		"SELECT COUNT(*) as count FROM exam_papers",
	) as unknown as { values: number[][] }[];
	return result[0]?.values[0]?.[0] ?? 0;
}

export function getAllExamPapers() {
	if (!db) return [];
	const result = db.exec(
		"SELECT id, subject_code, subject_name, year, paper_number, type, paper_id, memo_id, file_url, file_key, original_file_name, uploaded_at FROM exam_papers ORDER BY subject_code, year DESC, paper_number",
	);
	return rowsToObjects(result);
}

export function getExamPapersBySubject(subjectCode: string, year?: number) {
	if (!db) return [];
	let result;
	if (year) {
		result = db.exec(
			"SELECT id, subject_code, subject_name, year, paper_number, type, paper_id, memo_id, file_url, file_key, original_file_name, uploaded_at FROM exam_papers WHERE subject_code = ? AND year = ? ORDER BY paper_number",
			[subjectCode, year],
		);
	} else {
		result = db.exec(
			"SELECT id, subject_code, subject_name, year, paper_number, type, paper_id, memo_id, file_url, file_key, original_file_name, uploaded_at FROM exam_papers WHERE subject_code = ? ORDER BY year DESC, paper_number",
			[subjectCode],
		);
	}
	return rowsToObjects(result);
}

export function getExamPaperById(id: string) {
	if (!db) return undefined;
	const result = db.exec(
		"SELECT id, subject_code, subject_name, year, paper_number, type, paper_id, memo_id, file_url, file_key, original_file_name, uploaded_at FROM exam_papers WHERE id = ?",
		[id],
	);
	const rows = rowsToObjects(result);
	return rows[0];
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
	if (!db) return;

	const existing =
		record.type === "paper"
			? findPaperForMemo(record.subjectCode, record.year, record.paperNumber)
			: findMemoForPaper(record.subjectCode, record.year, record.paperNumber);

	if (existing) return;

	db.run(
		`INSERT INTO exam_papers (
			id, subject_code, subject_name, year, paper_number,
			type, paper_id, file_url, file_key, original_file_name
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		[
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
		],
	);
	saveExamsDb();
}

export function updateExamPaperMemoLink(paperId: string, memoId: string) {
	if (!db) return;
	db.run("UPDATE exam_papers SET memo_id = ? WHERE id = ? AND type = 'paper'", [
		memoId,
		paperId,
	]);
	saveExamsDb();
}

export function updateExamPaperPaperLink(memoId: string, paperId: string) {
	if (!db) return;
	db.run("UPDATE exam_papers SET paper_id = ? WHERE id = ? AND type = 'memo'", [
		paperId,
		memoId,
	]);
	saveExamsDb();
}

export function findPaperForMemo(
	subjectCode: string,
	year: number,
	paperNumber: number,
): string | null {
	if (!db) return null;
	const result = db.exec(
		"SELECT id FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'paper' LIMIT 1",
		[subjectCode, year, paperNumber],
	);
	const rows = rowsToObjects(result);
	return (rows[0]?.id as string) ?? null;
}

export function findMemoForPaper(
	subjectCode: string,
	year: number,
	paperNumber: number,
): string | null {
	if (!db) return null;
	const result = db.exec(
		"SELECT id FROM exam_papers WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'memo' LIMIT 1",
		[subjectCode, year, paperNumber],
	);
	const rows = rowsToObjects(result);
	return (rows[0]?.id as string) ?? null;
}

function rowsToObjects(result: unknown): Record<string, unknown>[] {
	const res = result as {
		columns: string[];
		values: unknown[][];
	}[];
	if (!res || res.length === 0 || !res[0].values) return [];
	const { columns, values } = res[0];
	return values.map((row) => {
		const obj: Record<string, unknown> = {};
		columns.forEach((col, i) => {
			obj[col] = row[i];
		});
		return obj;
	});
}
