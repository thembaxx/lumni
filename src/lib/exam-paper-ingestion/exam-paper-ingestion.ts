import { UTApi } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { parseMarkdown } from "@/lib/exam-parser";
import {
	convertPdfWithMarker,
	uploadImagesAndRewriteMarkdown,
} from "@/lib/exams/marker-client";
import type {
	IngestionMetadata,
	IngestionResult,
	IngestionSource,
} from "./types";

const utapi = new UTApi();

async function convertViaMarker(
	pdfBuffer: Buffer,
	filename: string,
): Promise<string> {
	const markerResult = await convertPdfWithMarker(pdfBuffer, filename);
	const processed = await uploadImagesAndRewriteMarkdown(
		markerResult.markdown,
		markerResult.images,
	);
	return processed.markdown;
}

async function convertViaMarkdownNew(pdfUrl: string): Promise<string> {
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

async function downloadPdf(url: string): Promise<Buffer> {
	const response = await fetch(url, { cache: "no-store" });
	if (!response.ok)
		throw new Error(`Failed to download PDF: ${response.status}`);
	return Buffer.from(await response.arrayBuffer());
}

export class ExamPaperIngestion {
	async ingest(source: IngestionSource): Promise<IngestionResult> {
		let pdfBuffer: Buffer;
		let filename: string;

		switch (source.type) {
			case "upload-thing": {
				const pdfFileResult = await utapi.getFileUrls([source.fileKey]);
				const pdfFiles = pdfFileResult.data || [];
				if (!pdfFiles.length || !pdfFiles[0]?.url) {
					throw new Error("File not found on UploadThing");
				}
				pdfBuffer = await downloadPdf(pdfFiles[0].url);
				filename = (pdfFiles[0]?.key || "exam-paper").replace(/\.pdf$/i, "");
				break;
			}
			case "url": {
				pdfBuffer = await downloadPdf(source.url);
				filename = source.filename.replace(/\.pdf$/i, "");
				break;
			}
			case "buffer": {
				pdfBuffer = Buffer.from(source.buffer);
				filename = source.filename.replace(/\.pdf$/i, "");
				break;
			}
			case "file-path": {
				const fs = await import("node:fs");
				pdfBuffer = fs.readFileSync(source.path);
				filename = source.filename.replace(/\.pdf$/i, "");
				break;
			}
		}

		let markdownContent: string;
		try {
			markdownContent = await convertViaMarker(pdfBuffer, `${filename}.pdf`);
		} catch {
			const tempUrl = `https://temp.local/${filename}.pdf`;
			markdownContent = await convertViaMarkdownNew(tempUrl);
		}

		const result = parseMarkdown(markdownContent, filename);

		const markdownBlob = new Blob([markdownContent], { type: "text/markdown" });
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
			throw new Error("Failed to upload converted files to UploadThing");
		}

		const doc = await databases.createDocument(
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
				fileKeys:
					source.type === "upload-thing"
						? JSON.stringify({ pdf: source.fileKey })
						: JSON.stringify({
								pdf: "",
								markdown: mdUpload.data?.key || "",
								json: jsonUpload.data?.key || "",
							}),
			},
		);
		const appwriteId = doc.$id;

		const sourceFileKey = source.type === "upload-thing" ? source.fileKey : "";
		const fileKeys = JSON.stringify({
			pdf: sourceFileKey,
			markdown: mdUpload.data?.key || "",
			json: jsonUpload.data?.key || "",
		});
		await databases.updateDocument(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			appwriteId,
			{ fileKeys },
		);

		return {
			id: appwriteId,
			markdownUrl: mdUpload.data?.url || "",
			jsonUrl: jsonUpload.data?.url || "",
			metadata: result.metadata as unknown as IngestionMetadata,
		};
	}
}

export const examPaperIngestion = new ExamPaperIngestion();
