import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { UTApi, UTFile } from "uploadthing/server";
import { getExamsDb, insertExamPaper, saveExamsDb } from "@/lib/db/exams";
import { requireAdmin } from "@/lib/server/auth";

const DEFAULT_FOLDER_PATH = `${(process as { cwd(): string }).cwd()}/downloads/exam-papers-2025`;

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
		const fsPromises = await import("node:fs/promises");
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

function dbExecOne(
	db: Awaited<ReturnType<typeof getExamsDb>>,
	sql: string,
	args?: unknown[],
): Record<string, unknown> | undefined {
	const result = db.exec(sql, args as (string | number | null | Uint8Array)[]);
	if (!result || result.length === 0 || !result[0].values) return undefined;
	const { columns, values } = result[0];
	if (values.length === 0) return undefined;
	const obj: Record<string, unknown> = {};
	columns.forEach((col: string, i: number) => {
		obj[col] = values[0][i];
	});
	return obj;
}

export async function POST(request: NextRequest) {
	try {
		await requireAdmin();

		const body = await request.json();
		const { folderPath } = body;

		const targetFolder = folderPath || DEFAULT_FOLDER_PATH;

		if (!fs.existsSync(/* turbopackIgnore: true */ targetFolder)) {
			return NextResponse.json(
				{ error: `Folder not found: ${targetFolder}` },
				{ status: 400 },
			);
		}

		const files = fs
			.readdirSync(/* turbopackIgnore: true */ targetFolder)
			.filter((f) => f.endsWith(".pdf"));

		if (files.length === 0) {
			return NextResponse.json(
				{ error: "No PDF files found in folder" },
				{ status: 400 },
			);
		}

		const db = await getExamsDb();
		let uploaded = 0;
		let updated = 0;
		const errors: string[] = [];

		const parsedFiles = files
			.map((fileName) => {
				const parsed = parseFilename(fileName);
				if (!parsed) {
					errors.push(`Could not parse filename: ${fileName}`);
					return null;
				}
				const { year, subjectCode, paperNumber, type, originalFileName } =
					parsed;
				const normalizedCode = normalizeSubjectCode(subjectCode);
				const subjectName = toTitleCase(normalizedCode);
				const filePath = path.join(
					/* turbopackIgnore: true */ targetFolder,
					fileName,
				);
				return {
					fileName,
					year,
					normalizedCode,
					subjectName,
					paperNumber,
					type,
					originalFileName,
					filePath,
				};
			})
			.filter(Boolean) as {
			fileName: string;
			year: number;
			normalizedCode: string;
			subjectName: string;
			paperNumber: number;
			type: "paper" | "memo";
			originalFileName: string;
			filePath: string;
		}[];

		const uploadResults = await Promise.all(
			parsedFiles.map(async (f) => {
				const uploadResult = await uploadToUploadThing(
					f.filePath,
					f.originalFileName,
				);
				if (!uploadResult) {
					return { ...f, uploadResult: null };
				}
				return { ...f, uploadResult };
			}),
		);

		for (const result of uploadResults) {
			if (!result.uploadResult) {
				errors.push(`${result.fileName}: Upload to uploadthing failed`);
				continue;
			}

			const existingPaper = dbExecOne(
				db,
				`SELECT id FROM exam_papers
					 WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = ?`,
				[result.normalizedCode, result.year, result.paperNumber, result.type],
			);

			if (existingPaper) {
				db.run(
					`UPDATE exam_papers
						 SET file_url = ?, file_key = ?, original_file_name = ?, uploaded_at = datetime('now')
						 WHERE id = ?`,
					[
						result.uploadResult.url,
						result.uploadResult.key,
						result.originalFileName,
						existingPaper.id as string,
					],
				);
				saveExamsDb();
				updated++;
			} else {
				const id = randomUUID();
				insertExamPaper({
					id,
					subjectCode: result.normalizedCode,
					subjectName: result.subjectName,
					year: result.year,
					paperNumber: result.paperNumber,
					type: result.type,
					paperId: null,
					fileUrl: result.uploadResult.url,
					fileKey: result.uploadResult.key,
					originalFileName: result.originalFileName,
				});

				if (result.type === "memo") {
					const paperResult = dbExecOne(
						db,
						`SELECT id FROM exam_papers
						 WHERE subject_code = ? AND year = ? AND paper_number = ? AND type = 'paper'`,
						[result.normalizedCode, result.year, result.paperNumber],
					);

					if (paperResult) {
						db.run("UPDATE exam_papers SET memo_id = ? WHERE id = ?", [
							id,
							paperResult.id as string,
						]);
						saveExamsDb();
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
