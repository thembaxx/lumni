import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Query } from "node-appwrite";
import { UTApi, UTFile } from "uploadthing/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { parseExamPaperFilename } from "@/lib/exams/helpers";
import { logError } from "@/lib/shared/logger";
import { getSubjectName } from "@/lib/subjects";

interface UploadedTracker {
	year: number;
	subjectCode: string;
	paperNumber: number;
	type: "paper" | "memo";
	originalFileName: string;
	fileUrl: string;
	fileKey: string;
}

const TRACKER_PATH = join(process.cwd(), "exam-papers-uploaded.json");
const DOWNLOADS_DIR = join(process.cwd(), "downloads", "exam-papers-2025");

let syncInProgress = false;
let syncCompleted = false;

function loadTracker(): UploadedTracker[] {
	try {
		if (!existsSync(TRACKER_PATH)) return [];
		const content = readFileSync(TRACKER_PATH, "utf-8");
		return JSON.parse(content) as UploadedTracker[];
	} catch (err) {
		logError("SyncExamPapers", err);
		return [];
	}
}

function saveTracker(tracker: UploadedTracker[]) {
	try {
		writeFileSync(TRACKER_PATH, JSON.stringify(tracker, null, 2), "utf-8");
	} catch (error) {
		console.error("[sync-exam-papers] Failed to save tracker:", error);
	}
}

function findLocalPdfs(): string[] {
	try {
		return readdirSync(DOWNLOADS_DIR)
			.filter((f) => f.endsWith(".pdf"))
			.sort();
	} catch (err) {
		logError("SyncExamPapers", err);
		return [];
	}
}

export function isSyncCompleted(): boolean {
	return syncCompleted;
}

export async function ensureExamPapersSynced(): Promise<void> {
	if (syncCompleted) return;
	if (syncInProgress) return;

	try {
		const existing = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.EXAM_PAPERS,
			[Query.limit(1)],
		);
		if (existing.documents.length > 0) {
			syncCompleted = true;
			return;
		}
	} catch {
		// Appwrite not available, continue with sync
	}

	syncInProgress = true;
	try {
		await syncExamPapersInternal();
		syncCompleted = true;
	} catch (error) {
		console.error("[sync-exam-papers] Sync failed:", error);
	} finally {
		syncInProgress = false;
	}
}

export async function syncExamPapers(): Promise<{
	uploaded: number;
	skipped: number;
	errors: string[];
}> {
	return syncExamPapersInternal(false);
}

export async function forceSyncExamPapers(): Promise<{
	uploaded: number;
	skipped: number;
	errors: string[];
}> {
	return syncExamPapersInternal(true);
}

async function syncExamPapersInternal(
	force: boolean = false,
): Promise<{ uploaded: number; skipped: number; errors: string[] }> {
	const tracker = loadTracker();
	const trackerSet = new Set(
		tracker.map(
			(t) => `${t.year}_${t.subjectCode}_p${t.paperNumber}_${t.type}`,
		),
	);

	const localPdfs = findLocalPdfs();
	const utapi = new UTApi();
	const errors: string[] = [];
	let inserted = 0;

	if (!force && tracker.length > 0) {
		const sortedTracker = tracker.toSorted((a, b) => {
			if (a.type === "paper" && b.type === "memo") return -1;
			if (a.type === "memo" && b.type === "paper") return 1;
			return 0;
		});

		const syncResults = await Promise.all(
			sortedTracker.map(async (entry) => {
				try {
					const id = crypto.randomUUID();
					const subjectName = getSubjectName(entry.subjectCode);
					const paperCode = `${entry.subjectCode}-p${entry.paperNumber}`;
					const examPeriod = entry.paperNumber > 2 ? "may-june" : "november";

					await databases.createDocument(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.EXAM_PAPERS,
						id,
						{
							subject: subjectName,
							subjectCode: entry.subjectCode,
							subjectName,
							paperCode,
							paperNumber: entry.paperNumber,
							examPeriod,
							year: entry.year,
							grade: 12,
							language: "english",
							totalMarks: 150,
							duration: "3 hours",
							type: entry.type,
							memoId: null,
							fileKeys: JSON.stringify([entry.fileKey]),
							fileUrl: entry.fileUrl,
							originalFileName: entry.originalFileName,
							uploadedAt: new Date().toISOString(),
							uploadedBy: "system",
						},
					);

					if (entry.type === "memo") {
						const paperDocs = await databases.listDocuments(
							APPWRITE_DATABASE_ID,
							COLLECTIONS.EXAM_PAPERS,
							[
								Query.equal("subjectCode", entry.subjectCode),
								Query.equal("year", entry.year),
								Query.equal("paperNumber", entry.paperNumber),
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

					return { ok: true as const };
				} catch (error) {
					return {
						ok: false as const,
						error: `${entry.originalFileName}: ${error instanceof Error ? error.message : "unknown"}`,
					};
				}
			}),
		);

		for (const r of syncResults) {
			if (r.ok) {
				inserted++;
			} else {
				errors.push(r.error);
			}
		}

		return { uploaded: inserted, skipped: 0, errors };
	}

	const toUpload: {
		filename: string;
		parsed: ReturnType<typeof parseExamPaperFilename>;
	}[] = [];
	for (const filename of localPdfs) {
		const parsed = parseExamPaperFilename(filename);
		if (!parsed) continue;
		toUpload.push({ filename, parsed });
	}

	let uploaded = 0;
	let skipped = 0;

	const uploadResults = await Promise.all(
		toUpload.map(async ({ filename, parsed }) => {
			if (!parsed) return { action: "skip" as const };

			const trackKey = `${parsed.year}_${parsed.subjectCode}_p${parsed.paperNumber}_${parsed.type}`;
			if (!force && trackerSet.has(trackKey)) {
				return { action: "skip" as const };
			}

			try {
				const filePath = join(DOWNLOADS_DIR, filename);
				const buffer = readFileSync(filePath);
				const uint8Array = new Uint8Array(buffer);
				const utFile = new UTFile([uint8Array], filename);

				const result = await utapi.uploadFiles(utFile);

				if (!result?.data) {
					return {
						action: "error" as const,
						error: `${filename}: upload failed`,
					};
				}

				const fileUrl = result.data.ufsUrl || result.data.url;
				const fileKey = result.data.key;
				const id = crypto.randomUUID();
				const subjectName = getSubjectName(parsed.subjectCode);
				const paperCode = `${parsed.subjectCode}-p${parsed.paperNumber}`;
				const examPeriod = parsed.paperNumber > 2 ? "may-june" : "november";

				await databases.createDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.EXAM_PAPERS,
					id,
					{
						subject: subjectName,
						subjectCode: parsed.subjectCode,
						subjectName,
						paperCode,
						paperNumber: parsed.paperNumber,
						examPeriod,
						year: parsed.year,
						grade: 12,
						language: "english",
						totalMarks: 150,
						duration: "3 hours",
						type: parsed.type,
						memoId: null,
						fileKeys: JSON.stringify([fileKey]),
						fileUrl,
						originalFileName: filename,
						uploadedAt: new Date().toISOString(),
						uploadedBy: "system",
					},
				);

				if (parsed.type === "memo") {
					const paperDocs = await databases.listDocuments(
						APPWRITE_DATABASE_ID,
						COLLECTIONS.EXAM_PAPERS,
						[
							Query.equal("subjectCode", parsed.subjectCode),
							Query.equal("year", parsed.year),
							Query.equal("paperNumber", parsed.paperNumber),
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

				return {
					action: "uploaded" as const,
					entry: {
						year: parsed.year,
						subjectCode: parsed.subjectCode,
						paperNumber: parsed.paperNumber,
						type: parsed.type,
						originalFileName: filename,
						fileUrl,
						fileKey,
					},
				};
			} catch (error) {
				return {
					action: "error" as const,
					error: `${filename}: ${error instanceof Error ? error.message : "unknown"}`,
				};
			}
		}),
	);

	for (const r of uploadResults) {
		if (r.action === "skip") {
			skipped++;
		} else if (r.action === "error") {
			errors.push(r.error);
		} else {
			tracker.push(r.entry);
			saveTracker(tracker);
			uploaded++;
		}
	}

	return { uploaded, skipped, errors };
}
