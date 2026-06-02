import { Query } from "node-appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const runtime = "nodejs";

function mapLocalPaper(row: Record<string, unknown>): Record<string, unknown> {
	return {
		id: row.id,
		subject: row.subject_name,
		subjectId: row.subject_code,
		year: row.year,
		session: null,
		type: row.type,
		paperNumber: row.paper_number,
		title: row.original_file_name,
		url: row.file_url,
		fileKey: row.file_key,
		uploadedAt: row.uploaded_at,
	};
}

type LocalDb = {
	getAllExamPapers: () => Record<string, unknown>[];
	getExamPapersBySubject: (
		subjectCode: string,
		year?: number,
	) => Record<string, unknown>[];
	checkAndPopulateExamsDb: () => Promise<{ populated: boolean; count: number }>;
};

async function getLocalDb(): Promise<LocalDb> {
	const [
		{ getAllExamPapers, getExamPapersBySubject },
		{ checkAndPopulateExamsDb },
	] = await Promise.all([
		import("@/lib/db/exams"),
		import("@/lib/server/exam-papers-db"),
	]);
	return { getAllExamPapers, getExamPapersBySubject, checkAndPopulateExamsDb };
}

export const GET = withRateLimit(
	createRouteHandler({
		auth: "required",
		execute: async ({ req }) => {
			const { searchParams } = new URL(req.url);
			const subjectCode = searchParams.get("subject");
			const year = searchParams.get("year");
			const id = searchParams.get("id");

			if (id) {
				const doc = await databases.getDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.EXAM_PAPERS,
					id,
				);
				if (!doc) {
					throw new HttpError(404, "Exam paper not found");
				}
				return {
					id: doc.$id,
					subject: doc.subject,
					paperCode: doc.paperCode,
					examPeriod: doc.examPeriod,
					year: doc.year,
					grade: doc.grade,
					language: doc.language,
					totalMarks: doc.totalMarks,
					duration: doc.duration,
					fileKeys: doc.fileKeys ? JSON.parse(doc.fileKeys as string) : null,
					uploadedAt: doc.uploadedAt,
				};
			}

			const queries: string[] = [];
			if (subjectCode) {
				queries.push(Query.equal("subject", subjectCode));
			}
			if (year) {
				queries.push(Query.equal("year", Number.parseInt(year, 10)));
			}

			const response = await databases.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.EXAM_PAPERS,
				queries,
			);

			const exams = response.documents.map((doc) => ({
				id: doc.$id,
				subject: doc.subject,
				paperCode: doc.paperCode,
				examPeriod: doc.examPeriod,
				year: doc.year,
				grade: doc.grade,
				language: doc.language,
				totalMarks: doc.totalMarks,
				duration: doc.duration,
				fileKeys: doc.fileKeys ? JSON.parse(doc.fileKeys as string) : null,
				uploadedAt: doc.uploadedAt,
			}));

			if (exams.length === 0) {
				const localDb = await getLocalDb();
				await localDb.checkAndPopulateExamsDb();

				const localPapers = subjectCode
					? localDb.getExamPapersBySubject(
							subjectCode,
							year ? Number.parseInt(year, 10) : undefined,
						)
					: localDb.getAllExamPapers();

				if (localPapers.length > 0) {
					return {
						exams: localPapers.map(mapLocalPaper),
						total: localPapers.length,
					};
				}
			}

			return { exams, total: exams.length };
		},
		errorLabel: "Exams",
	}),
	{ max: 15, windowMs: 60000 },
);
