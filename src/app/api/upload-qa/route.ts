import { NextRequest, NextResponse } from "next/server";

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function POST(req: NextRequest) {
	const formData = await req.formData();
	const file = formData.get("file") as File | null;
	const subject = formData.get("subject") as string | null;
	const fileNumber = Number(formData.get("number")) || 1;

	if (!file || !subject) {
		return NextResponse.json(
			{ error: "Missing required fields: file, subject, number" },
			{ status: 400 },
		);
	}

	const fileName = generateFileName(subject, fileNumber);
	const arrayBuffer = await file.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	const utApi = await import("uploadthing/server");
	const UTApi = utApi.UTApi;
	const UTFile = utApi.UTFile;

	const utFileObj = new UTFile([uint8Array], fileName);
	const utapi = new UTApi();

	try {
		const result = await utapi.uploadFiles(utFileObj);
		const uploadedFile = result[0];

		return NextResponse.json({
			success: true,
			url: uploadedFile.url,
			key: uploadedFile.key,
			fileName,
		});
	} catch (error) {
		console.error("Upload error:", error);
		const message = error instanceof Error ? error.message : String(error);
		return NextResponse.json(
			{ error: "Upload failed", details: message },
			{ status: 500 },
		);
	}
}