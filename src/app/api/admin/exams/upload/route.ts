import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { parseMarkdown } from "@/lib/exam-parser";

export const runtime = "nodejs";

const utapi = new UTApi();

export async function POST(request: Request) {
	try {
		const { fileKey } = await request.json();
		if (!fileKey) {
			return NextResponse.json({ error: "Missing fileKey" }, { status: 400 });
		}

		const pdfFileResult = await utapi.getFileUrls([fileKey]);
		const pdfFiles = pdfFileResult.data || [];
		if (!pdfFiles.length || !pdfFiles[0]?.url) {
			return NextResponse.json(
				{ error: "File not found on UploadThing" },
				{ status: 404 },
			);
		}

		const pdfUrl = pdfFiles[0].url;
		const filename = (pdfFiles[0]?.key || "exam-paper").replace(/\.pdf$/i, "");

		// Convert PDF to markdown using markdown.new API
		const encodedUrl = encodeURIComponent(pdfUrl);
		const convertUrl = `https://markdown.new/${encodedUrl}`;

		const conversionResponse = await fetch(convertUrl, {
			headers: { Accept: "text/markdown" },
		});

		if (!conversionResponse.ok) {
			return NextResponse.json(
				{
					error: `PDF conversion failed: ${conversionResponse.status}`,
				},
				{ status: 502 },
			);
		}

		const markdownContent = await conversionResponse.text();
		if (!markdownContent?.trim()) {
			return NextResponse.json(
				{ error: "Empty markdown from conversion" },
				{ status: 502 },
			);
		}

		const result = parseMarkdown(markdownContent, filename);

		const markdownBlob = new Blob([markdownContent], {
			type: "text/markdown",
		});
		const markdownFile = new File([markdownBlob], `${filename}.md`, {
			type: "text/markdown",
		});

		const jsonContent = JSON.stringify(result, null, 2);
		const jsonBlob = new Blob([jsonContent], { type: "application/json" });
		const jsonFile = new File([jsonBlob], `${filename}.json`, {
			type: "application/json",
		});

		const [mdUpload, jsonUpload] = await Promise.all([
			utapi.uploadFiles(markdownFile),
			utapi.uploadFiles(jsonFile),
		]);

		if (mdUpload.error || jsonUpload.error) {
			return NextResponse.json(
				{ error: "Failed to upload converted files" },
				{ status: 502 },
			);
		}

		const appwriteId = await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			"unique()",
			{
				subject: result.metadata.subject,
				paperCode: result.metadata.paperCode,
				examPeriod: result.metadata.examPeriod,
				year: result.metadata.year,
				grade: result.metadata.grade,
				language: result.metadata.language,
				totalMarks: result.metadata.totalMarks,
				duration: result.metadata.duration,
				fileKeys: JSON.stringify({
					pdf: fileKey,
					markdown: mdUpload.data?.key || "",
					json: jsonUpload.data?.key || "",
				}),
				uploadedAt: new Date().toISOString(),
				uploadedBy: "admin",
			},
		);

		return NextResponse.json({
			success: true,
			id: appwriteId,
			metadata: result.metadata,
		});
	} catch (error) {
		console.error("Exam upload error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to process exam paper",
			},
			{ status: 500 },
		);
	}
}
