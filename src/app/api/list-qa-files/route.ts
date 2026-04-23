"use server";

import { NextRequest, NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { formatSubjectName } from "@/lib/utils/upload-subject-questions";

function generateFileName(subject: string, number: number = 1): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const subject = searchParams.get("subject");
	const numberOfQuestions = parseInt(searchParams.get("n") || "20", 10);

	if (!subject) {
		return NextResponse.json({ error: "Missing subject" }, { status: 400 });
	}

	try {
		const utapi = new UTApi();
		const { files } = await utapi.listFiles({ limit: 500 });

		const fileNamePattern = generateFileName(subject).replace(
			/_\d+\.json$/,
			"_qa_",
		);
		const qaFiles = files
			.filter(
				(f) => f.name?.startsWith(fileNamePattern) && f.name?.endsWith(".json"),
			)
			.sort((a, b) => {
				const numA = parseInt(a.name!.match(/_(\d+)\.json$/)?.[1] || "0", 10);
				const numB = parseInt(b.name!.match(/_(\d+)\.json$/)?.[1] || "0", 10);
				return numA - numB;
			});

		const maxPerFile = 20;
		const expected = Math.ceil(numberOfQuestions / maxPerFile);
		const targetFiles = qaFiles.slice(0, expected);

		if (targetFiles.length === 0) {
			return NextResponse.json({ urls: [], error: "No files found" });
		}

		const urls = await Promise.all(
			targetFiles.map((f) => utapi.generateSignedURL(f.key)),
		);
		return NextResponse.json({ urls });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Unknown error",
				urls: [],
			},
			{ status: 500 },
		);
	}
}
