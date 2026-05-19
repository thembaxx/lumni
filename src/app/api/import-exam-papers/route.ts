import { Query } from "appwrite";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { COLLECTIONS, createDocument, listDocuments } from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function normalizeSubjectCode(code: string) {
	return code.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function toTitleCase(str: string) {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function importHandler(request: NextRequest) {
	await requireAdmin();

	try {
		const body = await request.json();
		const { uploads } = body;

		if (!uploads || !Array.isArray(uploads)) {
			return NextResponse.json(
				{ error: "Missing uploads array" },
				{ status: 400 },
			);
		}

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
			} = upload;

			try {
				const normalizedCode = normalizeSubjectCode(subjectCode);

				const subjects = await listDocuments(COLLECTIONS.SUBJECTS, [
					Query.equal("code", normalizedCode),
					Query.limit(1),
				]);

				let subjectId: string;
				if (subjects.length === 0) {
					subjectId = normalizedCode;
					await createDocument(COLLECTIONS.SUBJECTS, {
						name: toTitleCase(subjectCode),
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
				const error = err as Error & { message: string };
				console.error(`Error processing ${originalFileName}:`, error.message);
				errors.push(`${originalFileName}: ${error.message}`);
			}
		}

		return NextResponse.json({
			imported,
			skipped,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

export const POST = withRateLimit(importHandler, {
	max: 3,
	windowMs: 60000,
});
