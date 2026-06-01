import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, createDocument, listDocuments } from "@/lib/db/client";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function normalizeSubjectCode(code: string) {
	return code.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function toTitleCase(str: string) {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export const POST = withRateLimit(
	createRouteHandler({
		auth: "admin",
		validate: (body: Record<string, unknown>) => {
			if (!body.uploads || !Array.isArray(body.uploads))
				return "Missing uploads array";
			return null;
		},
		execute: async ({ body }) => {
			const { uploads } = body as { uploads: Record<string, unknown>[] };

			let imported = 0;
			let skipped = 0;
			const errors: string[] = [];

			for (const upload of uploads) {
				const {
					subjectCode,
					year,
					paperNumber,
					type,
					fileUrl,
					fileKey,
					originalFileName,
				} = upload as Record<string, string | number>;

				try {
					const normalizedCode = normalizeSubjectCode(subjectCode as string);

					const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
						Query.equal("code", normalizedCode),
						Query.limit(1),
					]);

					let subjectId: string;
					if (subjects.length === 0) {
						subjectId = normalizedCode;
						await createDocument(COLLECTIONS.SUBJECTS, {
							name: toTitleCase(subjectCode as string),
							code: normalizedCode,
							category: "general",
						});
					} else {
						subjectId = (subjects[0] as Record<string, unknown>).$id as string;
					}

					const existing = await listDocuments(COLLECTIONS.EXAM_PAPERS, [
						Query.equal("subjectId", subjectId),
						Query.equal("year", year),
						Query.equal("paperNumber", paperNumber),
						Query.equal("type", type),
						Query.limit(1),
					]);

					if (existing.length > 0) {
						skipped++;
						continue;
					}

					await createDocument(COLLECTIONS.EXAM_PAPERS, {
						subjectId,
						year,
						paperNumber,
						type,
						fileUrl,
						fileKey,
						originalFileName,
					});

					imported++;
				} catch (err) {
					const msg = err instanceof Error ? err.message : "Unknown error";
					console.error(`Error processing ${originalFileName}:`, msg);
					errors.push(`${originalFileName}: ${msg}`);
				}
			}

			return {
				imported,
				skipped,
				errors: errors.length > 0 ? errors : undefined,
			};
		},
		errorLabel: "Import exam papers",
	}),
	{ max: 3, windowMs: 60000 },
);
