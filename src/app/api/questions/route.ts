import * as fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import * as path from "path";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const subject = searchParams.get("subject") || "";
	const file = searchParams.get("file");

	try {
		let filePath = "";

		if (file) {
			const questionsDir = path.join(process.cwd(), "questions");
			filePath = path.join(questionsDir, file);
		} else if (subject) {
			const formattedSubject = subject.toLowerCase().replace(/\s+/g, "-");
			const questionsDir = path.join(process.cwd(), "questions");
			filePath = path.join(questionsDir, `${formattedSubject}_qa_1.json`);
		}

		if (!filePath || !fs.existsSync(filePath)) {
			return NextResponse.json(
				{ error: "Questions file not found" },
				{ status: 404 },
			);
		}

		const content = fs.readFileSync(filePath, "utf-8");
		const data = JSON.parse(content);

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
