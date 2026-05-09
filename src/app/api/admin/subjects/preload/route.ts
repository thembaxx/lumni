import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
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
		path.join(process.cwd(), "data", "exams", "index.json"),
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

export async function POST(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");

		if (action === "preload") {
			const subjects = await getSubjectsFromJson();

			const results = { added: 0, skipped: 0, errors: [] as string[] };

			for (const sub of subjects) {
				try {
					await createDocument(COLLECTIONS.SUBJECTS, {
						name: sub.name,
						code: sub.code,
						description: sub.description,
						category: sub.category,
					});
					results.added++;
				} catch (e) {
					const err = e as Error;
					if (
						err.message.includes("already exists") ||
						err.message.includes("duplicate")
					) {
						results.skipped++;
					} else {
						results.errors.push(sub.code + ": " + err.message);
					}
				}
			}

			return NextResponse.json({
				success: true,
				message: `Added ${results.added}, skipped ${results.skipped}`,
				results,
			});
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Server error" },
			{ status: 500 },
		);
	}
}
