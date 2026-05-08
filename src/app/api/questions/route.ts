import * as fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import * as path from "path";

export const runtime = "nodejs";

function sanitizeFileName(name: string): string {
	return name.replace(/[^a-zA-Z0-9_\-.]/g, "");
}

function matchesTopic(question: { topic?: string }, topic: string): boolean {
	if (!question.topic) return false;
	const normalizedQuestionTopic = question.topic
		.toLowerCase()
		.replace(/\s+/g, "-");
	const normalizedFilterTopic = topic.toLowerCase().replace(/\s+/g, "-");
	return (
		normalizedQuestionTopic.includes(normalizedFilterTopic) ||
		normalizedFilterTopic.includes(normalizedQuestionTopic)
	);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const subject = searchParams.get("subject") || "";
	const file = searchParams.get("file");
	const topic = searchParams.get("topic");

	try {
		const questionsDir = path.join(
			/*turbopackIgnore: true*/ process.cwd(),
			"questions",
		);

		if (!fs.existsSync(questionsDir)) {
			return NextResponse.json(
				{ error: "Questions directory not found" },
				{ status: 500 },
			);
		}

		let filePath = "";

		if (file) {
			const sanitized = sanitizeFileName(file);
			if (!sanitized || sanitized !== file) {
				return NextResponse.json(
					{ error: "Invalid file name" },
					{ status: 400 },
				);
			}
			filePath = path.join(/*turbopackIgnore: true*/ questionsDir, sanitized);
			const resolved = path.resolve(/*turbopackIgnore: true*/ filePath);
			if (
				!resolved.startsWith(
					path.resolve(/*turbopackIgnore: true*/ questionsDir),
				)
			) {
				return NextResponse.json(
					{ error: "Invalid file path" },
					{ status: 400 },
				);
			}
		} else if (subject) {
			const formattedSubject = subject.toLowerCase().replace(/\s+/g, "-");
			filePath = path.join(
				/*turbopackIgnore: true*/ questionsDir,
				`${formattedSubject}_qa_1.json`,
			);
		}

		if (!filePath || !fs.existsSync(filePath)) {
			return NextResponse.json(
				{ error: "Questions file not found" },
				{ status: 404 },
			);
		}

		const content = fs.readFileSync(filePath, "utf-8");
		let data;
		try {
			data = JSON.parse(content);
		} catch {
			return NextResponse.json(
				{ error: "Invalid JSON in questions file" },
				{ status: 500 },
			);
		}

		if (topic && data.questions) {
			data.questions = data.questions.filter((q: { topic?: string }) =>
				matchesTopic(q, topic),
			);
		}

		return NextResponse.json(data);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to load questions",
			},
			{ status: 500 },
		);
	}
}
