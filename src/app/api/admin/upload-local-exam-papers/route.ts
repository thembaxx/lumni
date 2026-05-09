import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { UTApi, UTFile } from "uploadthing/server";
import { NextRequest, NextResponse } from "next/server";
import { getExamsDb, insertExamPaper } from "@/lib/db/exams";

const FOLDER_PATH = path.join(process.cwd(), "downloads", "exam-papers-2025");

interface ParsedFile {
	year: number;
	subjectCode: string;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName: string;
}

const SUBJECT_CODE_MAP: Record<string, string> = {
	"agricultural-management-practices": "agricultural-management-practices",
	"agricultural-sciences": "agricultural-sciences",
	"agricultural-technology": "agricultural-technology",
	"business-studies": "business-studies",
	"computer-applications-technology": "computer-applications-technology",
	"consumer-studies": "consumer-studies",
	"dramatic-arts": "dramatic-arts",
	economics: "economics",
	"engineering-graphics-and-design": "engineering-graphics-and-design",
	geography: "geography",
	history: "history",
	"information-technology": "information-technology",
	"life-sciences": "life-sciences",
	mathematics: "mathematics",
	"physical-sciences": "physical-sciences",
	tourism: "tourism",
	"visual-arts": "visual-arts",
};

function parseFilename(filename: string): ParsedFile | null {
	const baseName = filename.replace(/\.pdf$/i, "");
	const isMemo = baseName.endsWith("_memo");
	const nameWithoutMemo = isMemo ? baseName.replace(/_memo$/, "") : baseName;

	const match = nameWithoutMemo.match(/^(\d{4})_([a-z_]+)_p(\d+)$/i);
	if (!match) return null;

	const year = parseInt(match[1], 10);
	const subjectCode = match[2].toLowerCase();
	const paperNumber = parseInt(match[3], 10);
	const type: "paper" | "memo" = isMemo ? "memo" : "paper";

	return {
		year,
		subjectCode,
		paperNumber,
		type,
		originalFileName: filename,
	};
}

function normalizeSubjectCode(code: string): string {
	const normalized = code.replace(/_/g, "-");
	return SUBJECT_CODE_MAP[normalized] || normalized;
}

function toTitleCase(str: string): string {
	return str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function uploadToUploadThing(
	filePath: string,
	fileName: string,
): Promise<{ url: string; key: string } | null> {
	try {
		const fsPromises = await import("fs/promises");
		const fileBuffer = await fsPromises.readFile(filePath);
		const uint8Array = new Uint8Array(fileBuffer);
		const utFile = new UTFile([uint8Array], fileName);

		const utapi = new UTApi();
		const result = await utapi.uploadFiles(utFile);

		if (!result?.data) {
			console.error("UploadThing upload failed:", result?.error);
			return null;
		}

		return {
			url: result.data.ufsUrl || result.data.url,
			key: result.data.key,
		};
	} catch (error) {
		console.error("Upload error:", error);
		return null;
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { folderPath } = body;

		const targetFolder = folderPath || FOLDER_PATH;

		if (!fs.existsSync(targetFolder)) {
			return NextResponse.json(
				{ error: `Folder not found: ${targetFolder}` },
				{ status: 400 },
			);
		}

		const files = fs.readdirSync(targetFolder).filter((f) => f.endsWith(".pdf"));

		if (files.length === 0) {
			return NextResponse.json(
				{ error: "No PDF files found in folder" },
				{ status: 400 },
			);
		}

		const db = getExamsDb();
		let uploaded = 0;
		let updated = 0;
		const errors: string[] = [];

		for (const fileName of files) {
			const parsed = parseFilename(fileName);
			if (!parsed) {
				errors.push(`Could not parse filename: ${fileName}`);
				continue;
			}

			const { year, subjectCode, paperNumber, type, originalFileName } = parsed;
			const normalizedCode = normalizeSubjectCode(subjectCode);
			const subjectName = toTitleCase(normalizedCode);

			const filePath = path.join(targetFolder, fileName);

			const uploadResult = await uploadToUploadThing(filePath, originalFileName);

			if (!uploadResult) {
				errors.push(`${fileName}: Upload to uploadthing failed`);
				continue;
			}

			const existingPaper = db
				.prepare(
					`SELECT id FROM exam_papers 
           WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = ?`,
				)
				.get(normalizedCode, year, paperNumber, type) as
				| { id: string }
				| undefined;

			if (existingPaper) {
				db.prepare(
					`UPDATE exam_papers 
           SET file_url = ?, file_key = ?, original_file_name = ?, uploaded_at = datetime('now')
           WHERE id = ?`,
				).run(uploadResult.url, uploadResult.key, originalFileName, existingPaper.id);
				updated++;
			} else {
				const id = randomUUID();
				insertExamPaper({
					id,
					subjectCode: normalizedCode,
					subjectName,
					year,
					paperNumber,
					type,
					paperId: null,
					fileUrl: uploadResult.url,
					fileKey: uploadResult.key,
					originalFileName,
				});

				if (type === "memo") {
					const paperResult = db
						.prepare(
							`SELECT id FROM exam_papers 
                 WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'paper'`,
						)
						.get(normalizedCode, year, paperNumber) as
						| { id: string }
						| undefined;

					if (paperResult) {
						db.prepare("UPDATE exam_papers SET memo_id = ? WHERE id = ?").run(
							id,
							paperResult.id,
						);
					}
				}
				uploaded++;
			}
		}

		return NextResponse.json({
			success: true,
			uploaded,
			updated,
			total: uploaded + updated,
			errors: errors.length > 0 ? errors : undefined,
		});
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}