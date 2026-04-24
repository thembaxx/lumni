import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { examPaper, subject } from "@/lib/db/schema";

function normalizeSubjectCode(code: string) {
	return code.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function toTitleCase(str: string) {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { uploads } = body;

		if (!uploads || !Array.isArray(uploads)) {
			return NextResponse.json(
				{ error: "Missing uploads array" },
				{ status: 400 },
			);
		}

		const db = getDb();
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

				// Find or create subject
				const subjectsResult = await db
					.select({ id: subject.id, code: subject.code })
					.from(subject)
					.where(eq(subject.code, normalizedCode))
					.limit(1);

				let subjectId;
				if (subjectsResult.length === 0) {
					subjectId = randomUUID();
					await db.insert(subject).values({
						id: subjectId,
						name: toTitleCase(subjectCode),
						code: normalizedCode,
						category: "general",
					});
				} else {
					subjectId = subjectsResult[0].id;
				}

				// Check if exam paper exists
				const existingResult = await db
					.select({ id: examPaper.id })
					.from(examPaper)
					.where(
						and(
							eq(examPaper.subjectId, subjectId),
							eq(examPaper.year, year),
							eq(examPaper.paperNumber, paperNumber),
							eq(examPaper.type, type),
						),
					)
					.limit(1);

				if (existingResult.length > 0) {
					skipped++;
					continue;
				}

				// Insert exam paper
				const examPaperId = randomUUID();
				await db.insert(examPaper).values({
					id: examPaperId,
					subjectId: subjectId,
					year: year,
					paperNumber: paperNumber,
					type: type,
					fileUrl: fileUrl,
					fileKey: fileKey,
					originalFileName: originalFileName,
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
