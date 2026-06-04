import { dexieDataAccess } from "@/lib/db";
import type { CachedPdf } from "../schema";

export async function cachePdf(
	paperId: string,
	pdfData: Blob,
	fileName: string,
): Promise<void> {
	const existing = await dexieDataAccess.cachedPdfs
		.where("paperId")
		.equals(paperId)
		.first();

	const entry: Omit<CachedPdf, "id"> = {
		paperId,
		pdfData,
		fileName,
		cachedAt: Date.now(),
	};

	if (existing) {
		await dexieDataAccess.cachedPdfs.update(existing.id ?? 0, entry);
	} else {
		await dexieDataAccess.cachedPdfs.add(entry);
	}
}

export async function getCachedPdf(
	paperId: string,
): Promise<CachedPdf | undefined> {
	return dexieDataAccess.cachedPdfs.where("paperId").equals(paperId).first();
}

export async function removeCachedPdf(paperId: string): Promise<void> {
	await dexieDataAccess.cachedPdfs.where("paperId").equals(paperId).delete();
}

export async function isPdfCached(paperId: string): Promise<boolean> {
	const entry = await getCachedPdf(paperId);
	return !!entry;
}

export async function getCachedPdfUrl(paperId: string): Promise<string | null> {
	const entry = await getCachedPdf(paperId);
	if (!entry) return null;
	return URL.createObjectURL(entry.pdfData);
}

export async function clearOldPdfCache(maxAgeHours = 168): Promise<void> {
	const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
	const old = await dexieDataAccess.cachedPdfs
		.where("cachedAt")
		.below(cutoff)
		.toArray();
	for (const entry of old) {
		URL.revokeObjectURL(entry.paperId);
	}
	await dexieDataAccess.cachedPdfs.where("cachedAt").below(cutoff).delete();
}
