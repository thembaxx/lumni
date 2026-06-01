import fs from "node:fs";
import path from "node:path";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { COLLECTIONS, createDocument } from "@/lib/db/client";

interface ExamPaperEntry {
	subjectId: string;
	subject: string;
}

interface ExamsData {
	exams: ExamPaperEntry[];
}

async function getSubjectsFromJson() {
	const fileContent = fs.readFileSync(
		path.resolve("data", "exams", "index.json"),
		"utf-8",
	);
	const examsData: ExamsData = JSON.parse(fileContent);

	const subjectMap = new Map<
		string,
		{ name: string; code: string; description: string; category: string }
	>();

	for (const exam of examsData.exams) {
		if (!subjectMap.has(exam.subjectId)) {
			subjectMap.set(exam.subjectId, {
				name: exam.subject,
				code: exam.subjectId,
				description: exam.subject,
				category: "academic",
			});
		}
	}

	return Array.from(subjectMap.values());
}

export const POST = createRouteHandler({
	auth: "admin",
	errorLabel: "PreloadSubjects",
	execute: async ({ req }) => {
		const { searchParams } = new URL(req.url);
		const action = searchParams.get("action");

		if (action !== "preload") {
			throw new HttpError(400, "Invalid action");
		}

		const subjects = await getSubjectsFromJson();

		const results = { added: 0, skipped: 0, errors: [] as string[] };

		const results_arr = await Promise.all(
			subjects.map(async (sub) => {
				try {
					await createDocument(COLLECTIONS.SUBJECTS, {
						name: sub.name,
						code: sub.code,
						description: sub.description,
						category: sub.category,
					});
					return { added: true, skipped: false, error: null };
				} catch (e) {
					const err = e as Error;
					if (
						err.message.includes("already exists") ||
						err.message.includes("duplicate")
					) {
						return { added: false, skipped: true, error: null };
					} else {
						return {
							added: false,
							skipped: false,
							error: `${sub.code}: ${err.message}`,
						};
					}
				}
			}),
		);
		for (const r of results_arr) {
			if (r.added) results.added++;
			if (r.skipped) results.skipped++;
			if (r.error) results.errors.push(r.error);
		}

		return {
			success: true,
			message: `Added ${results.added}, skipped ${results.skipped}`,
			results,
		};
	},
});
