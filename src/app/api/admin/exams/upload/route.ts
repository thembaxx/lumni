import { NextResponse } from "next/server";
import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { parseMarkdown } from "@/lib/exam-parser";
import {
	convertPdfWithMarker,
	uploadImagesAndRewriteMarkdown,
} from "@/lib/exams/marker-client";
import { requireAdmin } from "@/lib/server/auth";

export const runtime = "nodejs";

const utapi = new UTApi();

async function convertWithMarkdownNew(pdfUrl: string): Promise<string> {
	const response = await fetch("https://markdown.new/", {
		method: "POST",
		cache: "no-store",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url: pdfUrl }),
	});
	if (!response.ok) {
		throw new Error(`markdown.new conversion failed: ${response.status}`);
	}
	const result = await response.json();
	const content = result.content || result.markdown || "";
	if (!content?.trim()) throw new Error("Empty markdown from conversion");
	return content;
}

export async function POST(request: Request) {
	try {
		await requireAdmin();

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

		// Download PDF bytes for Marker
		const pdfResponse = await fetch(pdfUrl, { cache: "no-store" });
		if (!pdfResponse.ok) {
			return NextResponse.json(
				{ error: "Failed to download PDF" },
				{ status: 502 },
			);
		}
		const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());

		let markdownContent: string;

		try {
			// Try Marker microservice first (extracts images)
			const markerResult = await convertPdfWithMarker(
				pdfBuffer,
				`${filename}.pdf`,
			);
			const processed = await uploadImagesAndRewriteMarkdown(
				markerResult.markdown,
				markerResult.images,
			);
			markdownContent = processed.markdown;
		} catch {
			// Fallback to markdown.new (text-only, no images)
			markdownContent = await convertWithMarkdownNew(pdfUrl);
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
