import { randomUUID } from "node:crypto";
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { Query } from "node-appwrite";
import { UTApi, UTFile } from "uploadthing/server";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

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

export const POST = createRouteHandler({
	auth: "admin",
	errorLabel: "UploadLocalExamPapers",
	execute: async ({ body }) => {
		const { folderPath } = body as { folderPath?: string };

		const targetFolder = folderPath || DEFAULT_FOLDER_PATH;

		try {
			await access(targetFolder);
		} catch {
			throw new HttpError(400, `Folder not found: ${targetFolder}`);
		}

		const dirEntries = await readdir(targetFolder);
		const files = dirEntries.filter((f) => f.endsWith(".pdf"));

		if (files.length === 0) {
			throw new HttpError(400, "No PDF files found in folder");
		}

		let uploaded = 0;
		let updated = 0;
		const errors: string[] = [];

		const parsedFiles = files.flatMap((fileName) => {
			const parsed = parseFilename(fileName);
			if (!parsed) {
				errors.push(`Could not parse filename: ${fileName}`);
				return [];
			}
			const { year, subjectCode, paperNumber, type, originalFileName } = parsed;
			const normalizedCode = normalizeSubjectCode(subjectCode);
			const subjectName = toTitleCase(normalizedCode);
			const filePath = path.join(
				/* turbopackIgnore: true */ targetFolder,
				fileName,
			);
			return [
				{
					fileName,
					year,
					normalizedCode,
					subjectName,
					paperNumber,
					type,
					originalFileName,
					filePath,
				},
			];
		}) as {
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

		const processResults = await Promise.all(
			uploadResults.map(async (result) => {
				if (!result.uploadResult) {
					return { error: `${result.fileName}: Upload to uploadthing failed` };
				}

				const existingDocs = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.EXAM_PAPERS,
					[
						Query.equal("subjectCode", result.normalizedCode),
						Query.equal("year", result.year),
						Query.equal("paperNumber", result.paperNumber),
						Query.equal("type", result.type),
					],
				);

				if (existingDocs.documents.length > 0) {
					const existingId = existingDocs.documents[0].$id;
					await databases.updateDocument(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.EXAM_PAPERS,
						existingId,
						{
							fileUrl: result.uploadResult.url,
							fileKeys: JSON.stringify([result.uploadResult.key]),
							originalFileName: result.originalFileName,
							uploadedAt: new Date().toISOString(),
						},
					);
					return { updated: true };
				}

				const id = randomUUID();
				const paperCode = `${result.normalizedCode}-p${result.paperNumber}`;
				const examPeriod = result.paperNumber > 2 ? "may-june" : "november";

				await databases.createDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.EXAM_PAPERS,
					id,
					{
						subject: result.subjectName,
						subjectCode: result.normalizedCode,
						subjectName: result.subjectName,
						paperCode,
						paperNumber: result.paperNumber,
						examPeriod,
						year: result.year,
						grade: 12,
						language: "english",
						totalMarks: 150,
						duration: "3 hours",
						type: result.type,
						memoId: null,
						fileKeys: JSON.stringify([result.uploadResult.key]),
						fileUrl: result.uploadResult.url,
						originalFileName: result.originalFileName,
						uploadedAt: new Date().toISOString(),
						uploadedBy: "admin",
					},
				);

				if (result.type === "memo") {
					const paperDocs = await databases.listDocuments(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.EXAM_PAPERS,
						[
							Query.equal("subjectCode", result.normalizedCode),
							Query.equal("year", result.year),
							Query.equal("paperNumber", result.paperNumber),
							Query.equal("type", "paper"),
						],
					);

					if (paperDocs.documents.length > 0) {
						const paperId = paperDocs.documents[0].$id;
						await databases.updateDocument(
							APPWRITE_DATABASE_ID,
							COLLECTIONS.EXAM_PAPERS,
							id,
							{ memoId: paperId },
						);
						await databases.updateDocument(
							APPWRITE_DATABASE_ID,
							COLLECTIONS.EXAM_PAPERS,
							paperId,
							{ memoId: id },
						);
					}
				}
				return { uploaded: true };
			}),
		);

		for (const r of processResults) {
			if ("error" in r && r.error) {
				errors.push(r.error);
			} else if (r.updated) {
				updated++;
			} else {
				uploaded++;
			}
		}

		return {
			success: true,
			uploaded,
			updated,
			total: uploaded + updated,
			errors: errors.length > 0 ? errors : undefined,
		};
	},
});
