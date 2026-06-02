import examsData from "@/data/exams/index.json";
import { getExamPaperCount, getExamsDb, saveExamsDb } from "@/lib/db/exams";
import { auth } from "@/lib/server/auth";

export async function checkAndPopulateExamsDb() {
	const _userId = await auth();
	try {
		const count = getExamPaperCount();

		if (count > 0) {
			return { populated: false, count };
		}

		const exams = examsData.exams as {
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
