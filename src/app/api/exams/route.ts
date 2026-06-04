import { Query } from "node-appwrite";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const runtime = "nodejs";

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
					subjectCode: doc.subjectCode,
					paperCode: doc.paperCode,
					paperNumber: doc.paperNumber,
					examPeriod: doc.examPeriod,
					year: doc.year,
					grade: doc.grade,
					language: doc.language,
					totalMarks: doc.totalMarks,
					duration: doc.duration,
					type: doc.type,
					fileKeys: doc.fileKeys ? JSON.parse(doc.fileKeys as string) : null,
					fileUrl: doc.fileUrl,
					originalFileName: doc.originalFileName,
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
				subjectCode: doc.subjectCode,
				paperCode: doc.paperCode,
				paperNumber: doc.paperNumber,
				examPeriod: doc.examPeriod,
				year: doc.year,
				grade: doc.grade,
				language: doc.language,
				totalMarks: doc.totalMarks,
				duration: doc.duration,
				type: doc.type,
				fileKeys: doc.fileKeys ? JSON.parse(doc.fileKeys as string) : null,
				fileUrl: doc.fileUrl,
				originalFileName: doc.originalFileName,
				uploadedAt: doc.uploadedAt,
			}));

			return { exams, total: exams.length };
		},
		errorLabel: "Exams",
	}),
	{ max: 15, windowMs: 60000 },
);
