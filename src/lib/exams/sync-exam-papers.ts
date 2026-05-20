import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { UTApi, UTFile } from "uploadthing/server";
import {
	findPaperForMemo,
	getExamPaperCount,
	insertExamPaper,
	updateExamPaperMemoLink,
} from "@/lib/db/exams";
import { getSubjectName, parseExamPaperFilename } from "@/lib/db/exams/schema";

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
	} catch {
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
	} catch {
		return [];
	}
}

export function isSyncCompleted(): boolean {
	return syncCompleted;
}

export async function ensureExamPapersSynced(): Promise<void> {
	if (syncCompleted) return;
	if (syncInProgress) return;

	const count = getExamPaperCount();
	if (count > 0) {
		syncCompleted = true;
		return;
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

		for (const entry of sortedTracker) {
			try {
				const id = crypto.randomUUID();

				if (entry.type === "paper") {
					insertExamPaper({
						id,
						subjectCode: entry.subjectCode,
						subjectName: getSubjectName(entry.subjectCode),
						year: entry.year,
						paperNumber: entry.paperNumber,
						type: "paper",
						paperId: null,
						fileUrl: entry.fileUrl,
						fileKey: entry.fileKey,
						originalFileName: entry.originalFileName,
					});
				} else {
					const existingPaperId = findPaperForMemo(
						entry.subjectCode,
						entry.year,
						entry.paperNumber,
					);
					insertExamPaper({
						id,
						subjectCode: entry.subjectCode,
						subjectName: getSubjectName(entry.subjectCode),
						year: entry.year,
						paperNumber: entry.paperNumber,
						type: "memo",
						paperId: existingPaperId,
						fileUrl: entry.fileUrl,
						fileKey: entry.fileKey,
						originalFileName: entry.originalFileName,
					});
					if (existingPaperId) {
						updateExamPaperMemoLink(existingPaperId, id);
					}
				}

				inserted++;
			} catch (error) {
				errors.push(
					`${entry.originalFileName}: ${error instanceof Error ? error.message : "unknown"}`,
				);
			}
		}

		const finalCount = getExamPaperCount();
		if (finalCount === inserted + errors.length) {
			return { uploaded: inserted, skipped: 0, errors };
		}
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

				if (parsed.type === "paper") {
					insertExamPaper({
						id,
						subjectCode: parsed.subjectCode,
						subjectName: getSubjectName(parsed.subjectCode),
						year: parsed.year,
						paperNumber: parsed.paperNumber,
						type: "paper",
						paperId: null,
						fileUrl,
						fileKey,
						originalFileName: filename,
					});
				} else {
					const existingPaperId = findPaperForMemo(
						parsed.subjectCode,
						parsed.year,
						parsed.paperNumber,
					);

					insertExamPaper({
						id,
						subjectCode: parsed.subjectCode,
						subjectName: getSubjectName(parsed.subjectCode),
						year: parsed.year,
						paperNumber: parsed.paperNumber,
						type: "memo",
						paperId: existingPaperId,
						fileUrl,
						fileKey,
						originalFileName: filename,
					});

					if (existingPaperId) {
						updateExamPaperMemoLink(existingPaperId, id);
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
