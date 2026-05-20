#!/usr/bin/env tsx
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "node:fs";
import path from "node:path";
import { Client, Databases } from "node-appwrite";
import { UTApi, UTFile } from "uploadthing/server";
import { parseMarkdown } from "@/lib/exam-parser";
import {
	convertPdfWithMarker,
	uploadImagesAndRewriteMarkdown,
} from "@/lib/exams/marker-client";

const APPWRITE_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY || "";
const APPWRITE_DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "";
const COLLECTION_EXAM_PAPERS = "exam_papers";

const DEFAULT_PDF_DIR = path.resolve("public/docs/exams");
const MARKER_API_URL =
	process.env.MARKER_API_URL || "http://localhost:8000";

interface SeedOptions {
	year?: number;
	subject?: string;
	pdfDir: string;
}

interface PdfInfo {
	filePath: string;
	fileName: string;
	subject?: string;
	paperNumber?: number;
	year?: number;
	type?: "paper" | "memo";
}

async function validateEnv() {
	const missing: string[] = [];
	if (!APPWRITE_PROJECT) missing.push("NEXT_PUBLIC_APPWRITE_PROJECT_ID");
	if (!APPWRITE_API_KEY) missing.push("APPWRITE_API_KEY");
	if (!APPWRITE_DATABASE_ID) missing.push("APPWRITE_DATABASE_ID");
	if (missing.length > 0) {
		console.error(`Missing env vars: ${missing.join(", ")}`);
		process.exit(1);
	}
}

function scanLocalPdfs(pdfDir: string): PdfInfo[] {
	if (!fs.existsSync(pdfDir)) {
		console.error(`PDF directory not found: ${pdfDir}`);
		return [];
	}

	const files = fs
		.readdirSync(pdfDir)
		.filter((f) => f.endsWith(".pdf"))
		.sort();

	return files.map((fileName) => {
		const info: PdfInfo = { filePath: path.join(pdfDir, fileName), fileName };
		const name = fileName.replace(/\.pdf$/i, "");

		// Try underscore format: 2025_business_studies_p2.pdf
		const parts = name.split("_");
		if (parts.length >= 3) {
			const year = parseInt(parts[0], 10);
			if (!Number.isNaN(year)) info.year = year;
			info.subject = parts.slice(1, -1).join(" ");
			const lastPart = parts[parts.length - 1];
			if (lastPart.startsWith("p") || lastPart.startsWith("P")) {
				info.paperNumber = parseInt(lastPart.replace(/^p/i, ""), 10) || undefined;
			}
		} else {
			// Try space-separated format: "Geography P1 Nov 2025 Eng.pdf"
			const spaceParts = name.split(/\s+/);
			// Find paper code like P1, P2 etc
			const pIdx = spaceParts.findIndex(
				(p) => /^P\d+$/i.test(p) || /^Paper\s*\d+$/i.test(p),
			);
			if (pIdx > 0) {
				const paperCode = spaceParts[pIdx];
				info.paperNumber = parseInt(paperCode.replace(/^p/i, ""), 10) || undefined;
				// Year is usually 4-digit number like 2025
				const yearPart = spaceParts.find((p) => /^\d{4}$/.test(p));
				if (yearPart) info.year = parseInt(yearPart, 10);
				info.subject = spaceParts.slice(0, pIdx).join(" ");
			}
		}

		if (fileName.toLowerCase().includes("_memo") || fileName.toLowerCase().includes(" memo")) {
			info.type = "memo";
		} else {
			info.type = "paper";
		}
		return info;
	});
}

function parseSubjectForMetadata(subjectRaw: string): string {
	const map: Record<string, string> = {
		mathematics: "Mathematics",
		"physical sciences": "Physical Sciences",
		"life sciences": "Life Sciences",
		accounting: "Accounting",
		"business studies": "Business Studies",
		economics: "Economics",
		geography: "Geography",
		history: "History",
		"information technology": "Information Technology",
		"computer applications technology": "Computer Applications Technology",
		"dramatic arts": "Dramatic Arts",
		"visual arts": "Visual Arts",
		tourism: "Tourism",
		"agricultural sciences": "Agricultural Sciences",
		"consumer studies": "Consumer Studies",
	};
	const lower = subjectRaw.toLowerCase().trim();
	return map[lower] || subjectRaw;
}

async function downloadPdf(url: string): Promise<Buffer | null> {
	try {
		const response = await fetch(url, {
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
				Accept: "application/pdf,*/*",
			},
		});
		if (!response.ok) return null;
		const contentType = response.headers.get("content-type") || "";
		if (!contentType.includes("pdf") && !contentType.includes("octet-stream")) {
			return null;
		}
		return Buffer.from(await response.arrayBuffer());
	} catch {
		return null;
	}
}

async function convertWithMarkdownNew(pdfUrl: string): Promise<string> {
	const response = await fetch("https://markdown.new/", {
		method: "POST",
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

async function processPdf(
	pdfBuffer: Buffer,
	fileName: string,
	utapi: UTApi,
	databases: Databases,
): Promise<{ success: boolean; id?: string; error?: string }> {
	try {
		const uploadResult = await utapi.uploadFiles(
			new UTFile([new Uint8Array(pdfBuffer)], fileName),
		);
		if (uploadResult.error || !uploadResult.data) {
			return { success: false, error: `UploadThing upload failed` };
		}

		const fileKey = uploadResult.data.key;
		const pdfUrl = uploadResult.data.ufsUrl || uploadResult.data.url || "";
		const filename = fileName.replace(/\.pdf$/i, "");

		let markdownContent: string;
		let imageUrlMap: Record<string, string> = {};

		try {
			const markerResult = await convertPdfWithMarker(pdfBuffer, fileName);
			const processed = await uploadImagesAndRewriteMarkdown(
				markerResult.markdown,
				markerResult.images,
			);
			markdownContent = processed.markdown;
			imageUrlMap = processed.imageUrlMap;
		} catch {
			console.log(`    ↳ Marker unavailable, using markdown.new (text-only)`);
			markdownContent = await convertWithMarkdownNew(pdfUrl);
		}

		const result = parseMarkdown(markdownContent, filename);

		const mdFile = new UTFile(
			[new Uint8Array(Buffer.from(markdownContent, "utf-8"))],
			`${filename}.md`,
		);
		const jsonContent = JSON.stringify(result, null, 2);
		const jsonFile = new UTFile(
			[new Uint8Array(Buffer.from(jsonContent, "utf-8"))],
			`${filename}.json`,
		);

		const [mdUpload, jsonUpload] = await Promise.all([
			utapi.uploadFiles(mdFile),
			utapi.uploadFiles(jsonFile),
		]);

		if (mdUpload.error || jsonUpload.error) {
			return { success: false, error: "Failed to upload processed files" };
		}

		const doc = await databases.createDocument(
			APPWRITE_DATABASE_ID,
			COLLECTION_EXAM_PAPERS,
			"unique()",
			{
				subject: result.metadata.subject || parseSubjectForMetadata(filename),
				paperCode: result.metadata.paperCode || "P1",
				examPeriod: result.metadata.examPeriod || "November 2025",
				year: result.metadata.year,
				grade: result.metadata.grade || 12,
				language: result.metadata.language || "English",
				totalMarks: result.metadata.totalMarks || 150,
				duration: result.metadata.duration || "3 hours",
				fileKeys: JSON.stringify({
					pdf: fileKey,
					markdown: mdUpload.data?.key || "",
					json: jsonUpload.data?.key || "",
				}),
			},
		);

		const imageCount = Object.keys(imageUrlMap).length;
		const qCount = result.sections.reduce(
			(s, sec) => s + sec.questions.length,
			0,
		);
		console.log(
			`  ✓ ${fileName}: ${qCount} questions, ${imageCount} images`,
		);
		return { success: true, id: doc.$id };
	} catch (error) {
		const msg = error instanceof Error ? error.message : "Unknown error";
		return { success: false, error: msg };
	}
}

async function main() {
	await validateEnv();

	const args = process.argv.slice(2);
	const options: SeedOptions = {
		pdfDir: DEFAULT_PDF_DIR,
	};

	for (let i = 0; i < args.length; i++) {
		if (args[i] === "--dir" && args[i + 1]) {
			options.pdfDir = path.resolve(args[++i]);
		} else if (args[i] === "--year" && args[i + 1]) {
			options.year = parseInt(args[++i], 10);
		} else if (args[i] === "--subject" && args[i + 1]) {
			options.subject = args[++i].toLowerCase();
		} else if (args[i] === "--help") {
			console.log(`
Usage: tsx scripts/seed-exams-to-appwrite.ts [options]

Options:
  --dir <path>     PDF directory (default: public/docs/exams/)
  --year <number>  Filter by year
  --subject <str>  Filter by subject name
  --help           Show this help

Examples:
  tsx scripts/seed-exams-to-appwrite.ts
  tsx scripts/seed-exams-to-appwrite.ts --year 2025 --subject mathematics
  tsx scripts/seed-exams-to-appwrite.ts --dir ./downloads/exam-papers-2025
`);
			process.exit(0);
		}
	}

	const client = new Client()
		.setEndpoint(APPWRITE_ENDPOINT)
		.setProject(APPWRITE_PROJECT)
		.setKey(APPWRITE_API_KEY);

	const adminDatabases = new Databases(client);
	const utapi = new UTApi();

	const pdfs = scanLocalPdfs(options.pdfDir);
	if (pdfs.length === 0) {
		console.error("No PDFs found in", options.pdfDir);
		process.exit(1);
	}

	console.log(`Found ${pdfs.length} PDFs in ${options.pdfDir}`);

	const filtered = pdfs.filter((p) => {
		if (options.year && p.year !== options.year) return false;
		if (options.subject) {
			const subj = p.subject?.toLowerCase() || "";
			if (!subj.includes(options.subject)) return false;
		}
		return true;
	});

	console.log(`Processing ${filtered.length} PDFs...`);

	let success = 0;
	let failed = 0;

	const results = await Promise.all(
		filtered.map(async (pdf, i) => {
			console.log(
				`[${i + 1}/${filtered.length}] ${pdf.fileName} (${
					pdf.subject || "unknown"
				})`,
			);

			const buffer = fs.readFileSync(pdf.filePath);
			const result = await processPdf(buffer, pdf.fileName, utapi, adminDatabases);

			if (result.success) {
				return { success: true };
			}
			console.error(`  ✗ ${result.error}`);
			return { success: false };
		}),
	);

	success = results.filter((r) => r.success).length;
	failed = results.filter((r) => !r.success).length;

	console.log(`\nDone: ${success} succeeded, ${failed} failed`);
	process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
